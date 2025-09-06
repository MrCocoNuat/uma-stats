import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Chart,
  ChartEvent,
  ChartArea,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { after } from "node:test";
import { getRelativePosition } from "chart.js/helpers";

// Register necessary Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

// Extend Chart.js types to include crosshairHighlight plugin options
declare module "chart.js" {
  interface PluginOptionsByType<TType> {
    crosshairHighlight?: {
      highlightDataset?: number;
    }
  }
}

const DATASET_CLICK_Y_THRESHOLD =25; // pixels

function datasetClickPlugin(setHighlightDataset: ((index: number) => void)) {
  return {
    id: "datasetClick",
    afterEvent: (chart: Chart, args: { event: ChartEvent }) => {
      const { event } = args;
      if (event.type !== "click") {
        return;
      }

      const { x: mouseX, y: mouseY } = getRelativePosition(event, chart);

      const datasetCount = chart.data.datasets.length;
      const datasetMetas = chart.data.datasets.map((_, idx) => chart.getDatasetMeta(idx));

      // Get currently highlighted dataset index
      const highlightDataset = chart.options.plugins?.crosshairHighlight?.highlightDataset ?? 0;

      let highlightDatasetWithinThreshold = false;
      let closestDatasetIdx: number | null = null;
      let closestYDist = Number.POSITIVE_INFINITY;

      if (typeof mouseX === "number" && typeof mouseY === "number") {
        const rx = Math.round(mouseX);

        for (let idx = 0; idx < datasetCount; ++idx) {
          const meta = datasetMetas[idx];
          // Build xPointMap for this dataset
          const xPointMap: Record<number, PointElement> = {};
          for (const point of meta.data) {
            const px = Math.round(point.x);
            xPointMap[px] = point as PointElement;
          }

          // Find closest point by x (try up to 5 px away)
          let point: PointElement | undefined;
          for (let offset = 0; offset <= 5; ++offset) {
            if (xPointMap[rx + offset]) {
              point = xPointMap[rx + offset];
              break;
            }
            if (xPointMap[rx - offset]) {
              point = xPointMap[rx - offset];
              break;
            }
          }

          if (point) {
            const dist = Math.abs(point.y - mouseY);

            // Check threshold for highlighted dataset
            if (idx === highlightDataset && dist <= DATASET_CLICK_Y_THRESHOLD) {
              highlightDatasetWithinThreshold = true;
            }

            // Track closest dataset within threshold (but not highlighted)
            if (dist < closestYDist && dist <= DATASET_CLICK_Y_THRESHOLD) {
              closestYDist = dist;
              closestDatasetIdx = idx;
            }
          }
        }
      }

      // If click is within threshold of highlighted dataset, do nothing
      if (highlightDatasetWithinThreshold) {
        return;
      }

      if (!setHighlightDataset) return;

      if (
        closestDatasetIdx !== null &&
        closestDatasetIdx !== highlightDataset
      ) {
        setHighlightDataset(closestDatasetIdx);

        // Clear last clicked point for previous highlighted dataset
        const highlightDatasetMeta = chart.getDatasetMeta(highlightDataset);
        const metaWithPoint = highlightDatasetMeta as typeof highlightDatasetMeta & { _lastPointOfInterest?: {x: number, y: number} };
        metaWithPoint._lastPointOfInterest = undefined;
      }
    },
  }
};

// Chart.js plugin for crosshair and point highlight using an overlay canvas
function crosshairHighlightPlugin(setPointOfInterest?: ((point : {x: number, y: number} | null) => void)) {
  return {
    id: "crosshairHighlight",
    afterInit: (chart: Chart & {_crosshairOverlayCanvas? : HTMLCanvasElement}) => {
      // Create overlay canvas if not already present
      if (!chart._crosshairOverlayCanvas) {
        const mainCanvas = chart.canvas;
        const overlay = document.createElement("canvas");
        overlay.style.position = "absolute";
        overlay.style.left = mainCanvas.offsetLeft + "px";
        overlay.style.top = mainCanvas.offsetTop + "px";
        overlay.width = mainCanvas.width;
        overlay.height = mainCanvas.height;
        overlay.style.pointerEvents = "none";
        overlay.className = "chartjs-crosshair-overlay";
        mainCanvas.parentNode?.appendChild(overlay);
        chart._crosshairOverlayCanvas = overlay;
      }
    },
    afterEvent: (chart: Chart  & {_crosshairOverlayCanvas? : HTMLCanvasElement}, args: { event: ChartEvent }) => {
      const overlay: HTMLCanvasElement | undefined = chart._crosshairOverlayCanvas;
      if (!overlay) return;
      const ctx = overlay.getContext("2d");
      if (!ctx) return;
      const { chartArea } = chart;
      const { event } = args;
      if (!event || !event.x || !event.y) {
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        return;
      }

      const { x: mouseX, y: mouseY } = getRelativePosition(event, chart);

      // Clear overlay before drawing new crosshairs to avoid artifacts.
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      // Find the highlighted dataset index (or default to 0)
      const highlightDataset =
        chart.options.plugins?.crosshairHighlight?.highlightDataset ?? 0;

      // Find the dataset to highlight
      const datasetMeta = chart.getDatasetMeta(highlightDataset);
      if (!datasetMeta || !datasetMeta.data || datasetMeta.data.length === 0) return;

      // Build a map from rounded x to point (cache on meta for perf)
      const metaWithMap = datasetMeta as typeof datasetMeta & { _xPointMap?: Record<number, PointElement> };
      if (!metaWithMap._xPointMap) {
        metaWithMap._xPointMap = {};
        for (const point of datasetMeta.data) {
          const rx = Math.round(point.x);
          metaWithMap._xPointMap[rx] = point as PointElement;
        }
      }
      const xPointMap = metaWithMap._xPointMap;

      // Find the closest point by rounded x
      let closestPoint = null;
      if (typeof mouseX === "number") {
        const rx = Math.round(mouseX);
        // Try up to 5 px away if not found
        for (let offset = 0; offset <= 5; ++offset) {
          if (xPointMap[rx + offset]) {
            closestPoint = xPointMap[rx + offset];
            break;
          }
          if (xPointMap[rx - offset]) {
            closestPoint = xPointMap[rx - offset];
            break;
          }
        }
      }
      if (!closestPoint) return;

      const metaWithPoint = datasetMeta as typeof datasetMeta & { _lastPointOfInterest?: {x: number, y: number} };
      // Fire on click or while main mouse button is held down (drag)
      const nativeEvent = event.native;
      if (
        event.type === "click" ||
        (event.type === "mousemove" &&
          nativeEvent instanceof MouseEvent &&
          nativeEvent.buttons === 1)
      ) {
        metaWithPoint._lastPointOfInterest = { x: closestPoint.x, y: closestPoint.y };
        if (setPointOfInterest) {
          const xValue = chart.scales.x.getValueForPixel(closestPoint.x) as number;
          const yValue = chart.scales.y.getValueForPixel(closestPoint.y) as number;
          setPointOfInterest({ x: xValue, y: yValue });
        }
      } else if (!metaWithPoint._lastPointOfInterest) {
        // clear point of interest if not click and no last clicked point
        if (setPointOfInterest) {
          setPointOfInterest(null);
        }
      }

      // Highlight the point
      drawCrosshairs(ctx, closestPoint, chartArea);
      // Also highlight last clicked point if any
      if (metaWithPoint._lastPointOfInterest) {
        const lastPoint = metaWithPoint._lastPointOfInterest;
        drawCrosshairs(ctx, {x: lastPoint.x, y: lastPoint.y} as PointElement, chartArea);
      }
    },
    afterResize: (chart: Chart & {_crosshairOverlayCanvas? : HTMLCanvasElement}) => {
      // Resize overlay canvas to match chart
      const overlay: HTMLCanvasElement | undefined = chart._crosshairOverlayCanvas;
      if (overlay) {
        overlay.width = chart.width;
        overlay.height = chart.height;
      }
    },
    beforeDestroy: (chart: Chart & {_crosshairOverlayCanvas? : HTMLCanvasElement}) => {
      // Remove overlay canvas
      const overlay: HTMLCanvasElement | undefined = chart._crosshairOverlayCanvas;
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      chart._crosshairOverlayCanvas = undefined;
    },
  }

  function drawCrosshairs(ctx: CanvasRenderingContext2D, closestPoint: PointElement, chartArea : ChartArea) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(closestPoint.x, closestPoint.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();

    // Draw crosshair lines to axes
    ctx.save();
    ctx.strokeStyle = "rgba(200,0,0,0.5)";
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    // Vertical to x-axis
    ctx.beginPath();
    ctx.moveTo(closestPoint.x, closestPoint.y);
    ctx.lineTo(closestPoint.x, chartArea.bottom);
    ctx.stroke();
    // Horizontal to y-axis
    ctx.beginPath();
    ctx.moveTo(chartArea.left, closestPoint.y);
    ctx.lineTo(closestPoint.x, closestPoint.y);
    ctx.stroke();
    ctx.restore();
  }
};

export interface FunctionValueLineChartProps {
  /** Array of function values: [f(1), f(2), f(3), ...] OR array of the mentioned*/
  data: number[] | number[][];
  /** Optional: labels for the x-axis (defaults to [1,2,...]) */
  labels?: (string | number)[];
  /** Optional: dataset label */
  label?: string;
  highlightDataset?: number; // index of dataset to highlight
  setHighlightDataset?: (index: number) => void; 
  setPointOfInterest?: (point: {x: number, y: number} | null) => void; 
}

const FunctionValueLineChart: React.FC<FunctionValueLineChartProps> = ({
    data,
    labels,
    label = "f(x)",
    highlightDataset,
    setHighlightDataset,
    setPointOfInterest,
}) => {
    // Handle both single and multiple datasets
    const isMultipleDatasets = Array.isArray(data[0]);

    let inlinePlugins = [];
    if (setHighlightDataset) {
      inlinePlugins.push(crosshairHighlightPlugin(setPointOfInterest)); // order matters
      inlinePlugins.push(datasetClickPlugin(setHighlightDataset));
    }

    // If no labels provided, use [1, 2, 3, ...]
    const maxDatasetLength = isMultipleDatasets? (data as number[][]).reduce((max, arr) => Math.max(max, arr.length), 0) : (data as number[]).length;
    const chartLabels =
        labels && labels.length === maxDatasetLength
            ? labels
            : Array.from({ length: maxDatasetLength }, (_, i) => i + 1);

    const datasets = isMultipleDatasets
        ? (data as number[][]).map((dataset, idx) => ({
            label: label+idx,
            data: dataset,
            radius:0,
            borderColor: idx === highlightDataset ? "red":"rgba(80, 57, 57, 1)",
            order: idx === highlightDataset ? 1 : 99, // bring highlighted dataset to front
            }))
        : [{
                label,
                data,
                radius:0,
                borderColor: "red"
            }];

  const chartData = {
    labels: chartLabels,
    datasets: datasets 
  };

  const options = {
    responsive: true,
    animation: {
      duration: 500,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
      crosshairHighlight: {
        highlightDataset: highlightDataset ?? 0,
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "x",
        },
      },
      y: {
        title: {
          display: true,
          text: label,
        },
      },
    },
  };

  return (
    <div style={{ width: 600, height: 400 }}>
      <Line data={chartData} options={options} plugins={inlinePlugins} />
    </div>
  );
};

export default FunctionValueLineChart;
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
import { time } from "console";

// Register necessary Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
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
const CHART_Y_PADDING = 0.01; // fraction of chart height above 1.0, below 0.0 to add as padding

function datasetClickPlugin(setHighlightDataset: ((index: number) => void)) {
  return {
    id: "datasetClick",
    afterEvent: (chart: Chart & { _highlightDataset?: number }, args: { event: ChartEvent }) => {
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
          // Build xPointMap for this dataset using true data values
          const xPointMap: Record<number, { dataIndex: number, x: number, y: number }> = {};
          const dataset = chart.data.datasets[idx].data as number[];
          for (let i = 0; i < meta.data.length; ++i) {
            // Ensure dataX is a number
            const dataX = chart.data.labels ? chart.data.labels[i] : i + 1;
            const px = Math.round(chart.scales.x.getPixelForValue(Number(dataX)));
            const py = chart.scales.y.getPixelForValue(dataset[i]);
            xPointMap[px] = { dataIndex: i, x: px, y: py };
          }
          // Find closest point by x (try up to 5 px away)
          let point: { dataIndex: number, x: number, y: number } | undefined;
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

      if (
        closestDatasetIdx !== null &&
        closestDatasetIdx !== highlightDataset
      ) {
        setHighlightDataset(closestDatasetIdx);
        
        chart.update();

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
        const container = mainCanvas.parentNode as HTMLElement;
        const overlay = document.createElement("canvas");
        overlay.style.position = "absolute";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.width = mainCanvas.width;
        overlay.height = mainCanvas.height;
        overlay.style.pointerEvents = "none";
        overlay.className = "chartjs-crosshair-overlay";
        container.appendChild(overlay);
        chart._crosshairOverlayCanvas = overlay;
      }
    },
    afterEvent: (chart: Chart  & {_crosshairOverlayCanvas? : HTMLCanvasElement, _lastPointOfInterest?: {x: number, y: number}, _highlightDataset?: number, _lastMousePosition?: {x: number, y: number} }, args: { event: ChartEvent }) => {
      // Get overlay canvas and context
      const overlay: HTMLCanvasElement | undefined = chart._crosshairOverlayCanvas;
      if (!overlay) return;
      const ctx = overlay.getContext("2d");
      if (!ctx) return;

      const { chartArea } = chart;
      const { event } = args;
      
      if (event.type === "mouseenter" || event.type === "mouseout") {
        // leave the crosshair as is on mousein/mouseout
        return;
      }
      if (!event || !event.x || !event.y) {
        return;
      }

      // Track the last mouse position for afterDraw (store as data value)
      const mouseDataX = chart.scales.x.getValueForPixel(event.x) ?? 0;
      const mouseDataY = chart.scales.y.getValueForPixel(event.y) ?? 0;
      chart._lastMousePosition = { x: mouseDataX, y: mouseDataY };

      // Clear overlay before drawing new crosshairs to avoid artifacts.
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      // Redraw last point of interest if present (e.g. after resize)
      if (chart._lastPointOfInterest) {
        const lastPoint = chart._lastPointOfInterest;
        drawCrosshairs(ctx, lastPoint, chartArea, chart);
      }

      // Find the highlighted dataset index (or default to 0)
      const highlightDataset =
        chart._highlightDataset ??
        chart.options.plugins?.crosshairHighlight?.highlightDataset ?? 0;

      // Find the dataset to highlight
      const datasetMeta = chart.getDatasetMeta(highlightDataset);
      if (!datasetMeta || !datasetMeta.data || datasetMeta.data.length === 0) return;

      // Find the closest point by data x
      let closestPoint: { dataIndex: number, dataX: number, dataY: number } | null = null;
      if (typeof mouseDataX === "number") {
        let minDist = Infinity;
        const dataset = chart.data.datasets[highlightDataset].data as number[];
        for (let i = 0; i < datasetMeta.data.length; ++i) {
          const dataX = Number(chart.data.labels ? chart.data.labels[i] : i + 1);
          const dataY = dataset[i];
          const dist = Math.abs(dataX - mouseDataX);
          if (dist < minDist) {
        minDist = dist;
        closestPoint = { dataIndex: i, dataX, dataY };
          }
        }
      }
      if (!closestPoint) return;

      // Store last point of interest at chart level (as data values)
      // Fire on click or while main mouse button is held down (drag)
      const nativeEvent = event.native;
      if (
        event.type === "click" ||
        (event.type === "mousemove" &&
          nativeEvent instanceof MouseEvent &&
          nativeEvent.buttons === 1)
      ) {
        chart._lastPointOfInterest = { x: closestPoint.dataX, y: closestPoint.dataY };
        if (setPointOfInterest) {
          setPointOfInterest({ x: closestPoint.dataX, y: closestPoint.dataY });
        }
      } else if (!chart._lastPointOfInterest) {
        if (setPointOfInterest) {
          setPointOfInterest(null);
        }
      }
      // Highlight the mouse point
      drawCrosshairs(ctx, { x: closestPoint.dataX, y: closestPoint.dataY }, chartArea, chart);
    },
    afterDraw(chart: Chart & { _crosshairOverlayCanvas?: HTMLCanvasElement, _lastPointOfInterest?: { x: number, y: number }, _highlightDataset?: number, _lastMousePosition?: {x: number, y: number} }) {
      // Draw animated crosshair on every frame
      console.debug("afterDraw crosshairHighlight");
      const overlay: HTMLCanvasElement | undefined = chart._crosshairOverlayCanvas;
      if (!overlay) return;
      const ctx = overlay.getContext("2d");
      if (!ctx) return;
      if (!chart._lastPointOfInterest) return;
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      // Use the lastPointOfInterest (data values) to find the closest animated point
      const highlightDataset = chart._highlightDataset ?? chart.options.plugins?.crosshairHighlight?.highlightDataset ?? 0;
      const datasetMeta = chart.getDatasetMeta(highlightDataset);
      if (!datasetMeta || !datasetMeta.data || datasetMeta.data.length === 0) return;
      // Find the closest animated point by data x
      let closestPoint: { dataIndex: number, dataX: number, dataY: number } | null = null;
      let minDist = Infinity;
      const dataset = chart.data.datasets[highlightDataset].data as number[];
      for (let i = 0; i < datasetMeta.data.length; ++i) {
        const dataX = Number(chart.data.labels ? chart.data.labels[i] : i + 1);
        const dataY = chart.scales.y.getValueForPixel(datasetMeta.data[i].y) as number;
        const dist = Math.abs(dataX - chart._lastPointOfInterest.x);
        if (dist < minDist) {
          minDist = dist;
          closestPoint = { dataIndex: i, dataX, dataY };
        }
      }
      if (closestPoint) {
        drawCrosshairs(ctx, { x: closestPoint.dataX, y: closestPoint.dataY }, chart.chartArea, chart);
      }
      // Also redraw the crosshair at the mouse position if available
      if (chart._lastMousePosition) {
        // Find the closest point by data x
        let mouseClosestPoint: { dataIndex: number, dataX: number, dataY: number } | null = null;
        let minMouseDist = Infinity;
        for (let i = 0; i < datasetMeta.data.length; ++i) {
          const dataX = Number(chart.data.labels ? chart.data.labels[i] : i + 1);
        const dataY = chart.scales.y.getValueForPixel(datasetMeta.data[i].y) as number;
          const dist = Math.abs(dataX - chart._lastMousePosition.x);
          if (dist < minMouseDist) {
            minMouseDist = dist;
            mouseClosestPoint = { dataIndex: i, dataX, dataY };
          }
        }
        if (mouseClosestPoint) {
          drawCrosshairs(ctx, { x: mouseClosestPoint.dataX, y: mouseClosestPoint.dataY }, chart.chartArea, chart);
        }
      }
    },
    afterUpdate(chart : Chart & {_crosshairOverlayCanvas? : HTMLCanvasElement, _lastPointOfInterest?: {x: number, y: number}, _highlightDataset?: number }) {
      // This will run after chart.update() is called
      // You can check chart.options.plugins.crosshairHighlight.highlightDataset here

      // props might have changed! the cache map needs to be recalculated,
      // the highlight dataset checked,
      // and the overlay redrawn if necessary. Keep the x coordinate of the last point of interest, but recalculate and redraw y
      console.log("afterUpdate crosshairHighlight");
      const overlay: HTMLCanvasElement | undefined = chart._crosshairOverlayCanvas;
      if (!overlay) return;
      const ctx = overlay.getContext("2d");
      if (!ctx) return;

      // Clear overlay before drawing new crosshairs to avoid artifacts.
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      // If there was a last point of interest, try to recalculate its y for the new dataset
      if (chart._lastPointOfInterest) {
        const { x: lastX } = chart._lastPointOfInterest;

        // Find the highlighted dataset index (or default to 0)
        const highlightDataset =
          chart._highlightDataset ??
          chart.options.plugins?.crosshairHighlight?.highlightDataset ?? 0;

        // Find the dataset to highlight
        const datasetMeta = chart.getDatasetMeta(highlightDataset);
        if (!datasetMeta || !datasetMeta.data || datasetMeta.data.length === 0) return;

        // Find the closest point by data x
        let closestPoint: { dataIndex: number, dataX: number, dataY: number } | null = null;
        let minDist = Infinity;
        for (let i = 0; i < datasetMeta.data.length; ++i) {
          const dataX = Number(chart.data.labels ? chart.data.labels[i] : i + 1);
          const dataY = (chart.data.datasets[highlightDataset].data as number[])[i];
          const dist = Math.abs(dataX - lastX);
          if (dist < minDist) {
            minDist = dist;
            closestPoint = { dataIndex: i, dataX, dataY };
          }
        }
        if (closestPoint) {
          // Update lastPointOfInterest to new y (data values)
          chart._lastPointOfInterest = { x: closestPoint.dataX, y: closestPoint.dataY };
          if (setPointOfInterest) {
            setPointOfInterest({ x: closestPoint.dataX, y: closestPoint.dataY });
          }
          drawCrosshairs(ctx, { x: closestPoint.dataX, y: closestPoint.dataY }, chart.chartArea, chart);
        } else {
          chart._lastPointOfInterest = undefined;
        }
      }
    },
    afterResize: (chart: Chart & {_crosshairOverlayCanvas? : HTMLCanvasElement}) => {
      // Resize overlay canvas to match chart
      const overlay: HTMLCanvasElement | undefined = chart._crosshairOverlayCanvas;
      if (overlay) {
        overlay.width = chart.width;
        overlay.height = chart.height;
        // No need to update left/top, overlay is now always at (0,0) in the container
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

  function drawCrosshairs(ctx: CanvasRenderingContext2D, dataPoint: {x: number, y: number}, chartArea : ChartArea, chart: Chart) {
    // Convert data values to pixel values for drawing
    const dpr = window.devicePixelRatio || 1;
    const px = chart.scales.x.getPixelForValue(dataPoint.x);
    const py = chart.scales.y.getPixelForValue(dataPoint.y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) {
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(px * dpr, py * dpr, 6 * dpr, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.restore();

    // Draw crosshair lines to axes
    ctx.save();
    ctx.strokeStyle = "rgba(200,0,0,0.5)";
    ctx.lineWidth = 3 * dpr;
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    // Vertical to x-axis
    ctx.beginPath();
    ctx.moveTo(px * dpr, py * dpr);
    ctx.lineTo(px * dpr, chartArea.bottom * dpr);
    ctx.stroke();
    // Horizontal to y-axis
    ctx.beginPath();
    ctx.moveTo(chartArea.left * dpr, py * dpr);
    ctx.lineTo(px * dpr, py * dpr);
    ctx.stroke();
    ctx.restore();
  }
};

export interface FunctionValueLineChartProps {
  /** Array of function values: [f(1), f(2), f(3), ...] OR array of the mentioned*/
  data: number[] | number[][];
  /** Optional: labels for the x-axis (defaults to [1,2,...]) */
  labels?: (string | number)[];
  xLabel?: string;
  yLabel?: string;
  highlightDataset?: number; // index of dataset to highlight
  setHighlightDataset?: (index: number) => void; 
  setPointOfInterest?: (point: {x: number, y: number} | null) => void; 
}

function FunctionValueLineChart(props: FunctionValueLineChartProps) {
  const {
    data,
    labels,
    xLabel : propsXLabel,
    yLabel : propsYLabel,
    highlightDataset,
    setHighlightDataset,
    setPointOfInterest,
  } = props;

  // Set default values if not provided
  const xLabel = propsXLabel ?? "x";
  const yLabel = propsYLabel ?? "Probability";

  const chartRef = useRef<ChartJS<"line", number[] | number[][], unknown> | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update(); // Ensure chart updates when props change
    }
  }, [highlightDataset, data]);

  // Handle both single and multiple datasets
  const isMultipleDatasets = Array.isArray(data[0]);

  const inlinePlugins = [];
  if (setHighlightDataset) {
    inlinePlugins.push(datasetClickPlugin(setHighlightDataset));
    inlinePlugins.push(crosshairHighlightPlugin(setPointOfInterest));
  }

  // If no labels provided, use [1, 2, 3, ...]
  const maxDatasetLength = isMultipleDatasets
    ? (data as number[][]).reduce((max, arr) => Math.max(max, arr.length), 0)
    : (data as number[]).length;
  const chartLabels =
    labels && labels.length === maxDatasetLength
      ? labels
      : Array.from({ length: maxDatasetLength }, (_, i) => i + 1);

  const datasets = isMultipleDatasets
    ? (data as number[][]).map((dataset, idx) => ({
        label: yLabel + idx,
        data: dataset,
        radius: 0,
        borderColor: idx === highlightDataset ? "red" : "rgba(80, 57, 57, 1)",
        order: idx === highlightDataset ? 1 : 99, // bring highlighted dataset to front
      }))
    : [
        {
          label: yLabel,
          data,
          radius: 0,
          borderColor: "red",
        },
      ];

  const chartData = {
    labels: chartLabels,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    animation: {
      duration: 500,
    },
    plugins: {
      crosshairHighlight: {
        highlightDataset: highlightDataset ?? 0,
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: {
          display: true,
          text: xLabel,
        },
        ticks: {
          stepSize: 50,
        }
      },
      y: {
        type: 'linear' as const,
        title: {
          display: true,
          text: yLabel,
        },
        min: 0 - CHART_Y_PADDING,
        max: 1 + CHART_Y_PADDING,
        ticks: {
          callback: (value: number | string) => {
            // Convert value to number for comparison and round to 0.1
            const num = typeof value === "string" ? parseFloat(value) : value;
            if (Math.abs(num) < 1e-8) return "0";
            return Math.round(num * 10) / 10;
          },
        },
      },
    },
  };

  return (
    <div className="relative">
      <Line ref={chartRef} data={chartData} options={options} plugins={inlinePlugins}/>
    </div>
  );
}

export default FunctionValueLineChart;

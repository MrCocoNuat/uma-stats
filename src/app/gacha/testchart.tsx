import React from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Chart,
} from "chart.js";
import { Line } from "react-chartjs-2";

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
    };
  }
}

// Chart.js plugin for crosshair and point highlight
const CrosshairHighlightPlugin = {
  id: "crosshairHighlight",
  afterDraw: (chart: Chart & {_lastEvent: {x? : number, y? : number}}) => {
    const { ctx, chartArea, scales, tooltip } = chart;
    if (!chartArea) return;

    // Find the highlighted dataset index (or default to 0)
    const highlightDataset =
      chart.options.plugins?.crosshairHighlight?.highlightDataset ?? 0;

    // Get mouse position relative to chart (safe, public API)
    let mouseX: number | null = null;
    let mouseY: number | null = null;

    const activeElements = chart.getActiveElements();
    if (activeElements && activeElements.length > 0) {
        // Try to get the position from the first active element
        const element = activeElements[0].element;
        // Chart.js public API: getProps
        if (typeof element.getProps === "function") {
            const { x, y } = element.getProps(["x", "y"], true);
            mouseX = x;
            mouseY = y;
        }
    }

    // Fallback: use not public chart._lastEvent if available
    if ((mouseX === null || mouseY === null) && (chart)._lastEvent) {
    const evt = (chart)._lastEvent;
    if (evt.x !== undefined && evt.y !== undefined) {
        mouseX = evt.x;
        mouseY = evt.y;
    }
    }

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

    // Highlight the point
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
  },
};

// Register the plugin globally
ChartJS.register(CrosshairHighlightPlugin);

export interface FunctionValueLineChartProps {
  /** Array of function values: [f(1), f(2), f(3), ...] OR array of the mentioned*/
  data: number[] | number[][];
  /** Optional: labels for the x-axis (defaults to [1,2,...]) */
  labels?: (string | number)[];
  /** Optional: dataset label */
  label?: string;
  highlightDataset?: number; // index of dataset to highlight
}

const FunctionValueLineChart: React.FC<FunctionValueLineChartProps> = ({
    data,
    labels,
    label = "f(x)",
    highlightDataset
}) => {
    // Handle both single and multiple datasets
    const isMultipleDatasets = Array.isArray(data[0]);

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

      console.log(datasets);
  const chartData = {
    labels: chartLabels,
    datasets: datasets 
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
      crosshairHighlight: {
        highlightDataset: highlightDataset ?? 0,
      },
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
      <Line data={chartData} options={options} />
    </div>
  );
};

export default FunctionValueLineChart;
import { type ChartOptions, type ChartData } from "chart.js";
import { type TelemetryData } from "./pidSimulator";

export const combinedChartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  interaction: { mode: "index" as const, intersect: false },
  plugins: {
    legend: {
      position: "top" as const,
      labels: { color: "#64748b", font: { size: 12 } },
    },
  },
  scales: {
    x: {
      grid: { color: "#334155" },
      ticks: { color: "#64748b", font: { size: 11 } },
    },
    y: {
      type: "linear" as const,
      position: "left" as const,
      min: 0,
      max: 1200,
      grid: { color: "#334155" },
      ticks: {
        color: "#4ade80",
        font: { size: 11 },
        callback: (value) => `${value} об/мин`,
      },
      title: { display: true, text: "Частота вращения", color: "#4ade80" },
    },
    y1: {
      type: "linear" as const,
      position: "right" as const,
      min: 0,
      max: 105,
      grid: { drawOnChartArea: false },
      ticks: {
        color: "#f43f5e",
        font: { size: 11 },
        callback: (value) => `${value}%`,
      },
      title: { display: true, text: "Рейка ТНВД", color: "#f43f5e" },
    },
  },
};

export const getCombinedChartData = (
  history: TelemetryData[],
): ChartData<"line"> => ({
  labels: history.map((d) => d.time),
  datasets: [
    {
      label: "Уставка (об/мин)",
      data: history.map((d) => d.setpoint),
      borderColor: "#38bdf8",
      backgroundColor: "#38bdf8",
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.1,
      yAxisID: "y",
    },
    {
      label: "Фактические обороты (об/мин)",
      data: history.map((d) => d.actualRpm),
      borderColor: "#4ade80",
      backgroundColor: "#4ade80",
      borderWidth: 2.5,
      pointRadius: 0,
      tension: 0.1,
      yAxisID: "y",
    },
    {
      label: "Рейка ТНВД (%)",
      data: history.map((d) => d.fuelValve),
      borderColor: "#f43f5e",
      backgroundColor: "#f43f5e",
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.1,
      yAxisID: "y1",
    },
  ],
});

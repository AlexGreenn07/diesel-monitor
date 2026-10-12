import { type ChartOptions, type ChartData } from "chart.js";
import { type TelemetryData } from "./pidSimulator";

export const combinedChartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false, // Отключаем анимацию для плавного real-time стриминга
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        color: "#64748b",
        font: { size: 12 },
      },
    },
  },
  scales: {
    x: {
      grid: { color: "#334155" },
      ticks: { color: "#64748b", font: { size: 11 } },
    },
    // Левая ось для частоты вращения вала
    y: {
      type: "linear" as const,
      position: "left" as const,
      min: 0,
      max: 1600,
      grid: { color: "#334155" },
      ticks: {
        color: "#4ade80",
        font: { size: 11 },
        callback: (value) => `${value} об/мин`,
      },
      title: {
        display: true,
        text: "Частота вращения",
        color: "#4ade80",
      },
    },
    // Правая ось для положения рейки ТНВД
    y1: {
      type: "linear" as const,
      position: "right" as const,
      min: 0,
      max: 105,
      // Отключаем сетку для правой оси, чтобы линии не пересекались хаотично с левой сеткой
      grid: { drawOnChartArea: false },
      ticks: {
        color: "#f43f5e",
        font: { size: 11 },
        callback: (value) => `${value}%`,
      },
      title: {
        display: true,
        text: "Положение рейки ТНВД",
        color: "#f43f5e",
      },
    },
  },
};

// Функция сборки единого массива данных для совмещенного графика
export const getCombinedChartData = (
  history: TelemetryData[],
): ChartData<"line"> => ({
  labels: history.map((d) => d.time),
  datasets: [
    {
      label: "Уставка (Задание)",
      data: history.map((d) => d.setpoint),
      borderColor: "#38bdf8",
      backgroundColor: "#38bdf8",
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.1,
      yAxisID: "y", // Привязка к левой оси
    },
    {
      label: "Фактические обороты",
      data: history.map((d) => d.actualRpm),
      borderColor: "#4ade80",
      backgroundColor: "#4ade80",
      borderWidth: 2.5,
      pointRadius: 0,
      tension: 0.1,
      yAxisID: "y", // Привязка к левой оси
    },
    {
      label: "Положение рейки ТНВД (%)",
      data: history.map((d) => d.fuelValve),
      borderColor: "#f43f5e",
      backgroundColor: "#f43f5e",
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.1,
      yAxisID: "y1", // Ключевое отличие: привязка к правой оси
    },
  ],
});

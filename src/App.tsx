import { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Waves,
  Activity,
  Settings,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { DieselSimulator, type TelemetryData } from "./utils/pidSimulator";
import { WaveDisturbance } from "./utils/waveDisturbance";
import {
  combinedChartOptions,
  getCombinedChartData,
} from "./utils/chartConfig";
import { INITIAL_PID, CONTROL_LIMITS } from "./config/constants";
import styles from "./App.module.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  ChartLegend,
);

export default function App() {
  const [setpoint, setSetpoint] = useState<number>(
    CONTROL_LIMITS.SETPOINT.DEFAULT,
  );
  const [disturbance, setDisturbance] = useState<number>(
    CONTROL_LIMITS.DISTURBANCE.DEFAULT,
  );
  const [isWaveEnabled, setIsWaveEnabled] = useState<boolean>(
    CONTROL_LIMITS.WAVE_NOISE_DEFAULT,
  );

  // Коэффициенты ПИД-регулирования
  const kp = INITIAL_PID.KP;
  const ki = INITIAL_PID.KI;
  const kd = INITIAL_PID.KD;

  // ИСПРАВЛЕНО: Правильный синтаксис инициализации пустого массива с типом TelemetryData[]
  const [history, setHistory] = useState<TelemetryData[]>([]);

  const [currentData, setCurrentData] = useState<TelemetryData>({
    time: "",
    setpoint: CONTROL_LIMITS.SETPOINT.DEFAULT,
    actualRpm: 0,
    fuelValve: 0,
    pComponent: 0,
    iComponent: 0,
    dComponent: 0,
    frictionLoad: 0,
    auxLoad: 0,
    totalLoad: 0,
  });

  const simulatorRef = useRef(new DieselSimulator(0));

  useEffect(() => {
    const UI_INTERVAL_MS = 10;
    const SIM_STEP_MS = 1;
    const STEPS_PER_TICK = UI_INTERVAL_MS / SIM_STEP_MS;

    const interval = setInterval(() => {
      const randomNoise = WaveDisturbance.generate(disturbance, isWaveEnabled);
      const finalImpact = disturbance > 0 ? disturbance + randomNoise : 0;

      const newData = simulatorRef.current.updateBatch(
        setpoint,
        finalImpact,
        kp,
        ki,
        kd,
        STEPS_PER_TICK,
      );
      console.log(
        `RPM: ${newData.actualRpm}, Fuel: ${newData.fuelValve}, Load: ${newData.totalLoad}`,
      );

      setCurrentData(newData);

      // ИСПРАВЛЕНО: Безопасное обновление типизированного массива истории
      setHistory((prev) => {
        if (prev.length < 150) {
          return [...prev, newData];
        } else {
          return [...prev.slice(1), newData];
        }
      });
    }, UI_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [setpoint, disturbance, isWaveEnabled, kp, ki, kd]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>
          <Activity color="#38bdf8" size={28} /> Система мониторинга и
          автоматического регулирования ДВС
        </h1>
      </header>

      {/* Совмещенный блок графиков реального времени */}
      <div className={styles.chartsBlock}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            Совмещенный monitoring динамики ПИД-регулирования и нагрузок
          </h3>
          <div style={{ width: "100%", height: 380 }}>
            <Line
              data={getCombinedChartData(history)}
              options={combinedChartOptions}
            />
          </div>
        </div>
      </div>

      {/* Панели управления параметрами */}
      <div className={styles.controlsGrid}>
        {/* Левая панель: Уставки и Нагрузки */}
        <div className={styles.controlPanel}>
          <h4 className={styles.panelTitle}>
            <Settings size={18} /> Управление параметрами работы
          </h4>

          <div className={styles.controlGroup}>
            <div className={styles.controlHeader}>
              <span>Задать целевую частоту вращения:</span>
              <span style={{ fontWeight: "bold", color: "#38bdf8" }}>
                {setpoint} об/мин
              </span>
            </div>
            <input
              type="range"
              min={CONTROL_LIMITS.SETPOINT.MIN}
              max={CONTROL_LIMITS.SETPOINT.MAX}
              step={CONTROL_LIMITS.SETPOINT.STEP}
              value={setpoint}
              onChange={(e) => setSetpoint(Number(e.target.value))}
              className={styles.rangeInput}
              style={{ accentColor: "#38bdf8" }}
            />
          </div>

          <div className={styles.controlGroup}>
            <div className={styles.controlHeader}>
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Waves size={16} color="#f43f5e" /> Нагрузка на гребной винт
                (Шторм):
              </span>
              <span style={{ fontWeight: "bold", color: "#f43f5e" }}>
                {disturbance} ед.
              </span>
            </div>
            <input
              type="range"
              min={CONTROL_LIMITS.DISTURBANCE.MIN}
              max={CONTROL_LIMITS.DISTURBANCE.MAX}
              step={CONTROL_LIMITS.DISTURBANCE.STEP}
              value={disturbance}
              onChange={(e) => setDisturbance(Number(e.target.value))}
              className={styles.rangeInput}
              style={{ accentColor: "#f43f5e" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "16px",
              padding: "10px 12px",
              backgroundColor: "#0f172a",
              borderRadius: "8px",
            }}
          >
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>
              Случайные волновые колебания (Шум):
            </span>
            <button
              onClick={() => setIsWaveEnabled(!isWaveEnabled)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                padding: 0,
              }}
            >
              {isWaveEnabled ? (
                <ToggleRight size={36} color="#4ade80" />
              ) : (
                <ToggleLeft size={36} color="#64748b" />
              )}
            </button>
          </div>
        </div>

        {/* Правая панель: Единая телеметрия системы */}
        <div className={styles.controlPanel}>
          <h4 className={styles.panelTitle} style={{ color: "#eab308" }}>
            <Eye size={18} /> Телеметрия состояния ДВС и ПИД
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              className={styles.pidMonitorRow}
              style={{ borderLeft: "3px solid #4ade80" }}
            >
              <span style={{ color: "#4ade80", fontWeight: "bold" }}>
                Текущая частота вращения:
              </span>
              <span
                className={styles.pidValueBadge}
                style={{ color: "#4ade80" }}
              >
                {currentData.actualRpm} об/мин
              </span>
            </div>

            <div
              className={styles.pidMonitorRow}
              style={{ borderLeft: "3px solid #f43f5e" }}
            >
              <span style={{ color: "#f43f5e", fontWeight: "bold" }}>
                Подача топлива (Рейка ТНВД):
              </span>
              <span
                className={styles.pidValueBadge}
                style={{ color: "#f43f5e" }}
              >
                {currentData.fuelValve} %
              </span>
            </div>

            <div
              className={styles.pidMonitorRow}
              style={{ borderLeft: "3px solid #fb923c", marginTop: "6px" }}
            >
              <span style={{ color: "#fb923c" }}>
                Потери на механическое трение:
              </span>
              <span
                className={styles.pidValueBadge}
                style={{ color: "#fb923c" }}
              >
                {currentData.frictionLoad} ед.
              </span>
            </div>

            <div
              className={styles.pidMonitorRow}
              style={{ borderLeft: "3px solid #94a3b8" }}
            >
              <span style={{ color: "#94a3b8" }}>
                Навесные механизмы (Aux Load):
              </span>
              <span
                className={styles.pidValueBadge}
                style={{ color: "#94a3b8" }}
              >
                {currentData.auxLoad} ед.
              </span>
            </div>

            <div
              className={styles.pidMonitorRow}
              style={{
                border: "1px solid #a855f7",
                backgroundColor: "#0f172a",
              }}
            >
              <span style={{ color: "#a855f7", fontWeight: "bold" }}>
                Суммарный тормозящий момент:
              </span>
              <span
                className={styles.pidValueBadge}
                style={{ color: "#a855f7" }}
              >
                {currentData.totalLoad} ед.
              </span>
            </div>

            <div
              className={styles.pidMonitorRow}
              style={{ borderLeft: "3px solid #38bdf8", marginTop: "6px" }}
            >
              <span style={{ color: "#38bdf8" }}>
                Вклад Р-составляющей (Пропорц.):
              </span>
              <span
                className={styles.pidValueBadge}
                style={{ color: "#38bdf8" }}
              >
                {currentData.pComponent}%
              </span>
            </div>

            <div
              className={styles.pidMonitorRow}
              style={{ borderLeft: "3px solid #eab308" }}
            >
              <span style={{ color: "#eab308" }}>
                Вклад I-составляющей (Интегр.):
              </span>
              <span
                className={styles.pidValueBadge}
                style={{ color: "#eab308" }}
              >
                {currentData.iComponent}%
              </span>
            </div>

            <div
              className={styles.pidMonitorRow}
              style={{ borderLeft: "3px solid #ec4899" }}
            >
              <span style={{ color: "#ec4899" }}>
                Вклад D-составляющей (Диффер.):
              </span>
              <span
                className={styles.pidValueBadge}
                style={{ color: "#ec4899" }}
              >
                {currentData.dComponent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

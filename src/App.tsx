import { useState, useEffect, useRef, useCallback } from "react";
import { Line } from "react-chartjs-2";
import { Activity, Settings, Eye, Play, Pause, RotateCcw } from "lucide-react";
import { DieselSimulator, type TelemetryData } from "./engine/pidSimulator";
import {
  combinedChartOptions,
  getCombinedChartData,
} from "./engine/chartConfig";
import {
  INITIAL_PID,
  CONTROL_LIMITS,
  DIESEL_PHYSICS,
  LOAD_MODES,
  type LoadMode,
} from "./config/constants";
import { createDrivetrain } from "./engine/drivetrain/DrivetrainFactory";
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

// Пустая телеметрия — используется при сбросе
const EMPTY_TELEMETRY: TelemetryData = {
  timestampMs: 0,
  time: "",
  setpoint: CONTROL_LIMITS.SETPOINT.DEFAULT,
  actualRpm: 0,
  fuelValve: 0,
  pComponent: 0,
  iComponent: 0,
  dComponent: 0,
  frictionLoad: 0,
  auxLoad: 0,
  externalLoad: 0,
  totalLoad: 0,
  engineTorque: 0,
  powerKw: 0,
  loadPct: 0,
  mode: "NONE",
  drivetrainTelemetry: {},
};

export default function App() {
  const [setpoint, setSetpoint] = useState<number>(
    CONTROL_LIMITS.SETPOINT.DEFAULT,
  );
  const [loadPct, setLoadPct] = useState<number>(CONTROL_LIMITS.LOAD.DEFAULT);
  const [mode, setMode] = useState<LoadMode>("NONE");

  // --- Управление симуляцией ---
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const kp = INITIAL_PID.KP;
  const ki = INITIAL_PID.KI;
  const kd = INITIAL_PID.KD;

  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [currentData, setCurrentData] =
    useState<TelemetryData>(EMPTY_TELEMETRY);

  const simulatorRef = useRef(new DieselSimulator(0));
  const drivetrainRef = useRef(createDrivetrain("NONE"));

  // При смене режима — пересоздаём drivetrain и сбрасываем регулятор
  useEffect(() => {
    drivetrainRef.current = createDrivetrain(mode);
    // Не сбрасываем обороты при смене режима — только интегратор
    simulatorRef.current.resetIntegral();
  }, [mode]);

  // --- Основной цикл ---
  useEffect(() => {
    if (!isRunning) return;

    const UI_INTERVAL_MS = DIESEL_PHYSICS.UI_INTERVAL_MS;
    const STEPS_PER_TICK = Math.round(
      UI_INTERVAL_MS / (DIESEL_PHYSICS.DT * 1000),
    );

    const interval = setInterval(() => {
      const newData = simulatorRef.current.updateBatch(
        setpoint,
        loadPct,
        0, // stormFactor — заглушка
        drivetrainRef.current,
        mode,
        kp,
        ki,
        kd,
        STEPS_PER_TICK,
      );

      setCurrentData(newData);
      setHistory((prev) => {
        const cutoff = performance.now() - DIESEL_PHYSICS.HISTORY_WINDOW_MS;
        const trimmed = prev.filter((d) => d.timestampMs >= cutoff);
        return [...trimmed, newData];
      });
    }, UI_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isRunning, setpoint, loadPct, mode, kp, ki, kd]);

  // --- Обработчики ---
  const handleStart = useCallback(() => setIsRunning(true), []);
  const handlePause = useCallback(() => setIsRunning(false), []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    simulatorRef.current.reset(0); // обнулить обороты и ПИД
    drivetrainRef.current = createDrivetrain(mode);
    setHistory([]);
    setCurrentData(EMPTY_TELEMETRY);
  }, [mode]);

  const isGeneratorMode = mode === "GENERATOR";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>
          <Activity color="#38bdf8" size={28} /> Система мониторинга и
          автоматического регулирования ДВС 16ЧН26/26
        </h1>
      </header>

      {/* === Панель управления симуляцией === */}
      <div className={styles.simControls}>
        <button
          onClick={handleStart}
          disabled={isRunning}
          style={{
            padding: "8px 20px",
            backgroundColor: isRunning ? "#1e293b" : "#22c55e",
            color: isRunning ? "#475569" : "#0f172a",
            border: "1px solid #334155",
            borderRadius: "6px",
            cursor: isRunning ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Play size={16} /> Пуск
        </button>

        <button
          onClick={handlePause}
          disabled={!isRunning}
          style={{
            padding: "8px 20px",
            backgroundColor: !isRunning ? "#1e293b" : "#eab308",
            color: !isRunning ? "#475569" : "#0f172a",
            border: "1px solid #334155",
            borderRadius: "6px",
            cursor: !isRunning ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Pause size={16} /> Пауза
        </button>

        <button
          onClick={handleReset}
          style={{
            padding: "8px 20px",
            backgroundColor: "#f43f5e",
            color: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <RotateCcw size={16} /> Сброс
        </button>

        <div
          style={{
            marginLeft: "16px",
            fontSize: "13px",
            color: isRunning ? "#4ade80" : "#eab308",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: isRunning ? "#4ade80" : "#eab308",
            }}
          />
          {isRunning ? "Симуляция идёт" : "Пауза"}
        </div>
      </div>

      <div className={styles.chartsBlock}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            Совмещённый мониторинг ПИД-регулирования и нагрузок (СИ)
          </h3>
          <div style={{ width: "100%", height: 380 }}>
            <Line
              data={getCombinedChartData(history)}
              options={combinedChartOptions}
            />
          </div>
        </div>
      </div>

      <div className={styles.controlsGrid}>
        {/* ЛЕВАЯ ПАНЕЛЬ */}
        <div className={styles.controlPanel}>
          <h4 className={styles.panelTitle}>
            <Settings size={18} /> Управление параметрами работы
          </h4>

          {/* Режим работы */}
          <div className={styles.controlGroup}>
            <div className={styles.controlHeader}>
              <span>Режим работы:</span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {LOAD_MODES.map((m) => (
                <button
                  key={m.id}
                  disabled={!m.enabled}
                  onClick={() => m.enabled && setMode(m.id)}
                  style={{
                    padding: "8px",
                    backgroundColor: mode === m.id ? "#38bdf8" : "#1e293b",
                    color:
                      mode === m.id
                        ? "#0f172a"
                        : m.enabled
                          ? "#94a3b8"
                          : "#475569",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    cursor: m.enabled ? "pointer" : "not-allowed",
                    fontWeight: "bold",
                    fontSize: "12px",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Уставка */}
          <div className={styles.controlGroup}>
            <div className={styles.controlHeader}>
              <span>Целевая частота вращения:</span>
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

          {/* Нагрузка (только в режиме GENERATOR) */}
          {isGeneratorMode && (
            <div className={styles.controlGroup}>
              <div className={styles.controlHeader}>
                <span>Нагрузка на реостате:</span>
                <span style={{ fontWeight: "bold", color: "#f43f5e" }}>
                  {loadPct} %
                </span>
              </div>
              <input
                type="range"
                min={CONTROL_LIMITS.LOAD.MIN}
                max={CONTROL_LIMITS.LOAD.MAX}
                step={CONTROL_LIMITS.LOAD.STEP}
                value={loadPct}
                onChange={(e) => setLoadPct(Number(e.target.value))}
                className={styles.rangeInput}
                style={{ accentColor: "#f43f5e" }}
              />
            </div>
          )}
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ */}
        <div className={styles.controlPanel}>
          <h4 className={styles.panelTitle} style={{ color: "#eab308" }}>
            <Eye size={18} /> Телеметрия состояния ДВС и ПИД
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Row label="Режим" color="#a855f7" value={mode} />
            <Row
              label="Текущая частота вращения"
              color="#4ade80"
              value={`${currentData.actualRpm} об/мин`}
            />
            <Row
              label="Подача топлива (рейка ТНВД)"
              color="#f43f5e"
              value={`${currentData.fuelValve} %`}
            />
            <Row
              label="Момент двигателя"
              color="#22c55e"
              value={`${currentData.engineTorque} Н·м`}
            />
            <Row
              label="Полезная мощность"
              color="#0ea5e9"
              value={`${currentData.powerKw} кВт`}
            />
            <Row
              label="Потери на трение"
              color="#fb923c"
              value={`${currentData.frictionLoad} Н·м`}
            />
            <Row
              label="Навесные механизмы (Aux)"
              color="#94a3b8"
              value={`${currentData.auxLoad} Н·м`}
            />
            <Row
              label="Внешняя нагрузка"
              color="#a855f7"
              value={`${currentData.externalLoad} Н·м`}
            />
            <Row
              label="Суммарный тормозящий момент"
              color="#a855f7"
              value={`${currentData.totalLoad} Н·м`}
              border
            />

            {Object.entries(currentData.drivetrainTelemetry).map(([k, v]) => (
              <Row key={k} label={k} color="#38bdf8" value={String(v)} />
            ))}

            <Row
              label="Вклад P-составляющей"
              color="#38bdf8"
              value={`${currentData.pComponent}%`}
            />
            <Row
              label="Вклад I-составляющей"
              color="#eab308"
              value={`${currentData.iComponent}%`}
            />
            <Row
              label="Вклад D-составляющей"
              color="#ec4899"
              value={`${currentData.dComponent}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  color,
  value,
  border,
}: {
  label: string;
  color: string;
  value: string;
  border?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 12px",
        backgroundColor: "#0f172a",
        border: border ? `1px solid ${color}` : undefined,
        borderLeft: border ? undefined : `3px solid ${color}`,
        borderRadius: "6px",
        fontSize: "13px",
      }}
    >
      <span style={{ color }}>{label}:</span>
      <span
        style={{
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: "14px",
          color,
        }}
      >
        {value}
      </span>
    </div>
  );
}

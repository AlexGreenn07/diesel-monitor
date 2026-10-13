import { DIESEL_PHYSICS, type LoadMode } from "../config/constants";
import { EnginePhysics } from "./enginePhysics";
import type {
  IDrivetrain,
  DrivetrainTelemetry,
} from "./drivetrain/IDrivetrain";

export interface TelemetryData {
  timestampMs: number;
  time: string;
  setpoint: number;
  actualRpm: number;
  fuelValve: number;
  pComponent: number;
  iComponent: number;
  dComponent: number;
  frictionLoad: number;
  auxLoad: number;
  externalLoad: number;
  totalLoad: number;
  engineTorque: number;
  powerKw: number;
  loadPct: number;
  mode: LoadMode;
  drivetrainTelemetry: DrivetrainTelemetry;
}

export class DieselSimulator {
  private actualRpm: number = 0;
  private integral: number = 0;
  private dFiltered: number = 0;
  private prevFuelValve: number = 0;

  constructor(initialRpm: number = 0) {
    this.actualRpm = initialRpm;
  }

  /** Полный сброс: обороты, интегратор, фильтр D, рейка */
  public reset(currentRpm: number = 0) {
    this.actualRpm = currentRpm;
    this.integral = 0;
    this.dFiltered = 0;
    this.prevFuelValve = 0;
  }

  /** Сброс только регулятора (без изменения оборотов) */
  public resetIntegral() {
    this.integral = 0;
    this.dFiltered = 0;
  }

  public updateBatch(
    setpoint: number,
    loadPct: number,
    stormFactor: number,
    drivetrain: IDrivetrain,
    mode: LoadMode,
    kp: number,
    ki: number,
    kd: number,
    stepsCount: number,
  ): TelemetryData {
    const {
      DT,
      DEADBAND_RPM,
      ANTI_WINDUP_LIMIT,
      MAX_FUEL_RATE,
      FUEL_MIN,
      FUEL_MAX,
    } = DIESEL_PHYSICS;

    let fuelValve = this.prevFuelValve;
    let pComp = 0,
      iComp = 0,
      dComp = 0;
    let friction = 0,
      aux = 0,
      ext = 0,
      totalRes = 0,
      engTorque = 0;
    let lastOmega = 0;
    let lastTelemetry: DrivetrainTelemetry = {};

    let currentRpm = this.actualRpm;
    let prevMicroRpm = this.actualRpm;

    for (let i = 0; i < stepsCount; i++) {
      const error = setpoint - currentRpm;
      const effectiveError = Math.abs(error) < DEADBAND_RPM ? 0 : error;

      pComp = effectiveError * kp;

      this.integral += effectiveError * DT;
      this.integral = Math.max(
        -ANTI_WINDUP_LIMIT,
        Math.min(ANTI_WINDUP_LIMIT, this.integral),
      );
      iComp = this.integral * ki;

      const dInputRaw = (currentRpm - prevMicroRpm) / DT;
      const alpha = 0.1;
      this.dFiltered += alpha * (dInputRaw - this.dFiltered);
      dComp = -(this.dFiltered * kd);

      let targetFuel = pComp + iComp + dComp;
      targetFuel = Math.max(FUEL_MIN, Math.min(FUEL_MAX, targetFuel));

      const maxDelta = MAX_FUEL_RATE * DT;
      fuelValve = Math.max(
        this.prevFuelValve - maxDelta,
        Math.min(this.prevFuelValve + maxDelta, targetFuel),
      );
      this.prevFuelValve = fuelValve;

      prevMicroRpm = currentRpm;

      const report = EnginePhysics.getNextRpmReport(
        currentRpm,
        fuelValve,
        drivetrain,
        { omega: 0, loadPct, stormFactor, dt: DT },
      );
      currentRpm = report.newRpm;

      friction = report.frictionLoad;
      aux = report.auxLoad;
      ext = report.externalLoad;
      totalRes = report.totalResistance;
      engTorque = report.engineTorque;
      lastOmega = report.omega;
      lastTelemetry = report.telemetry;
    }

    this.actualRpm = currentRpm;
    const usefulPowerW = ext * lastOmega;

    return {
      timestampMs: performance.now(),
      time: new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      setpoint,
      actualRpm: Math.round(this.actualRpm),
      fuelValve: Math.round(fuelValve),
      pComponent: Math.round(pComp),
      iComponent: Math.round(iComp),
      dComponent: Math.round(dComp),
      frictionLoad: Math.round(friction),
      auxLoad: Math.round(aux),
      externalLoad: Math.round(ext),
      totalLoad: Math.round(totalRes),
      engineTorque: Math.round(engTorque),
      powerKw: +(usefulPowerW / 1000).toFixed(1),
      loadPct,
      mode,
      drivetrainTelemetry: lastTelemetry,
    };
  }
}

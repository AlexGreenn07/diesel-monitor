import { DIESEL_PHYSICS } from "../config/constants";
import { EnginePhysics } from "./enginePhysics";

export interface TelemetryData {
  time: string;
  setpoint: number;
  actualRpm: number;
  fuelValve: number;
  pComponent: number;
  iComponent: number;
  dComponent: number;
  frictionLoad: number;
  auxLoad: number;
  totalLoad: number;
}

export class DieselSimulator {
  private actualRpm: number = 0;
  private integral: number = 0;
  private dFiltered: number = 0;
  private prevFuelValve: number = 0;

  constructor(initialRpm: number = 0) {
    this.actualRpm = initialRpm;
  }

  public reset(currentRpm: number) {
    this.integral = 0;
    this.actualRpm = currentRpm;
    this.dFiltered = 0;
  }

  public updateBatch(
    setpoint: number,
    disturbance: number,
    kp: number,
    ki: number,
    kd: number,
    stepsCount: number,
  ): TelemetryData {
    let fuelValve = 0;
    let pComp = 0;
    let iComp = 0;
    let dComp = 0;
    let friction = 0;
    let aux = 0;

    let currentRpm = this.actualRpm;
    // Обороты на ПРЕДЫДУЩЕМ микрошаге (для честной производной)
    let prevMicroRpm = this.actualRpm;

    for (let i = 0; i < stepsCount; i++) {
      const error = setpoint - currentRpm;
      const effectiveError =
        Math.abs(error) < DIESEL_PHYSICS.DEADBAND_RPM ? 0 : error;

      // 1. P-составляющая
      pComp = effectiveError * kp;

      // 2. I-составляющая с защитой от насыщения
      this.integral += effectiveError * DIESEL_PHYSICS.DT;
      this.integral = Math.max(
        -DIESEL_PHYSICS.ANTI_WINDUP_LIMIT,
        Math.min(DIESEL_PHYSICS.ANTI_WINDUP_LIMIT, this.integral),
      );
      iComp = this.integral * ki;

      // 3. D-составляющая — производная между соседними микрошагами
      const dInputRaw = (currentRpm - prevMicroRpm) / DIESEL_PHYSICS.DT;

      // Экспоненциальный ФНЧ для подавления шума
      const filterCoefficient = 0.1;
      this.dFiltered += filterCoefficient * (dInputRaw - this.dFiltered);

      // Если обороты падают (dFiltered < 0), минус на минус даст плюс —
      // это ускорит открытие рейки ТНВД и уменьшит просадку
      dComp = -(this.dFiltered * kd);

      // Суммируем вклады и ограничиваем ход рейки
      fuelValve = pComp + iComp + dComp;
      const MAX_FUEL_RATE = 50; // % в секунду
      const maxDelta = MAX_FUEL_RATE * DIESEL_PHYSICS.DT;
      fuelValve = Math.max(
        this.prevFuelValve - maxDelta,
        Math.min(this.prevFuelValve + maxDelta, fuelValve),
      );
      this.prevFuelValve = fuelValve;

      // Запоминаем текущие обороты для следующей итерации
      prevMicroRpm = currentRpm;

      // 4. Физика двигателя
      const report = EnginePhysics.getNextRpmReport(
        currentRpm,
        fuelValve,
        disturbance,
      );
      currentRpm = report.newRpm;
      friction = report.frictionLoad;
      aux = report.auxLoad;
    }

    this.actualRpm = currentRpm;

    return {
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
      frictionLoad: friction,
      auxLoad: aux,
      totalLoad: Math.round(friction + aux + disturbance),
    };
  }
}

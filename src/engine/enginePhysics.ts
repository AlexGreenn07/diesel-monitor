import { DIESEL_PHYSICS } from "../config/constants";
import type {
  IDrivetrain,
  DrivetrainInput,
  DrivetrainTelemetry,
} from "./drivetrain/IDrivetrain";

export interface PhysicsReport {
  newRpm: number;
  engineTorque: number;
  frictionLoad: number;
  auxLoad: number;
  externalLoad: number; // момент от трансмиссии, приведённый к валу
  totalResistance: number;
  omega: number;
  telemetry: DrivetrainTelemetry;
}

export class EnginePhysics {
  /** M_тр = a + b·ω + c·ω²  [Н·м] */
  public static calculateFriction(omega: number): number {
    const { FRICTION_A: a, FRICTION_B: b, FRICTION_C: c } = DIESEL_PHYSICS;
    return a + b * omega + c * omega * omega;
  }

  /** M_aux = aux_a + aux_b·ω  [Н·м] */
  public static calculateAuxiliaryLoad(omega: number): number {
    const { AUX_A, AUX_B } = DIESEL_PHYSICS;
    return AUX_A + AUX_B * omega;
  }

  /** M_двиг = (fuelValve / 100) · M_max  [Н·м] */
  public static calculateEngineTorque(fuelValve: number): number {
    const f = Math.max(0, Math.min(100, fuelValve));
    return (f / 100) * DIESEL_PHYSICS.M_MAX;
  }

  /**
   * Шаг интегрирования уравнения вращательного движения:
   *
   *   J_прив · dω/dt = M_двиг − M_тр − M_aux − M_нагр
   *
   * M_нагр и J_прив берутся из drivetrain (режим работы).
   */
  public static getNextRpmReport(
    currentRpm: number,
    fuelValve: number,
    drivetrain: IDrivetrain,
    input: DrivetrainInput,
  ): PhysicsReport {
    const { DT, RPM_TO_RADS, RADS_TO_RPM } = DIESEL_PHYSICS;

    const omega = RPM_TO_RADS(currentRpm);
    const J_eff = drivetrain.getEffectiveInertia();

    const engineTorque = this.calculateEngineTorque(fuelValve);
    const frictionLoad = this.calculateFriction(omega);
    const auxLoad = this.calculateAuxiliaryLoad(omega);
    const externalLoad = drivetrain.getLoadTorque(omega, input);
    const totalResistance = frictionLoad + auxLoad + externalLoad;

    const dOmega = ((engineTorque - totalResistance) / J_eff) * DT;
    const newOmega = Math.max(0, omega + dOmega);
    const newRpm = RADS_TO_RPM(newOmega);

    const telemetry = drivetrain.getTelemetry
      ? drivetrain.getTelemetry(omega, input)
      : {};

    return {
      newRpm,
      engineTorque,
      frictionLoad,
      auxLoad,
      externalLoad,
      totalResistance,
      omega: newOmega,
      telemetry,
    };
  }
}

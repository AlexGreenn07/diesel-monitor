import { DIESEL_PHYSICS, GENERATOR } from "../../config/constants";
import type {
  IDrivetrain,
  DrivetrainInput,
  DrivetrainTelemetry,
} from "./IDrivetrain";

/**
 * Режим 2: Дизель + генератор, работающий на реостат.
 *
 * Физика:
 *   E = k_e · ω                    — ЭДС
 *   I = E / (R_внутр + R_нагр)     — ток
 *   P_эл = E · I                   — электрическая мощность
 *   M_ген = P_эл / (η_ген · ω)     — момент на валу
 *
 * Упрощение (R_внутр << R_нагр):
 *   M_ген = K_GEN · ω · (loadPct / 100)
 *
 * Ключевое: обороты НЕ привязаны к частоте сети 50 Гц —
 * это нагрузочное устройство, а не генераторный агрегат.
 */
export class GeneratorDrivetrain implements IDrivetrain {
  readonly name = "Генератор (реостат)";

  getLoadTorque(omega: number, input: DrivetrainInput): number {
    const pct = Math.max(0, Math.min(100, input.loadPct));
    return GENERATOR.K_GEN * omega * (pct / 100);
  }

  getEffectiveInertia(): number {
    return DIESEL_PHYSICS.J + GENERATOR.J_GEN;
  }

  getTelemetry(omega: number, input: DrivetrainInput): DrivetrainTelemetry {
    const M_gen = this.getLoadTorque(omega, input);
    const P_mech = M_gen * omega; // Вт — механическая
    const P_el = P_mech * GENERATOR.ETA_GEN; // Вт — электрическая

    // Справочно: если бы это был синхронный генератор с p парами полюсов,
    // частота была бы f = n·p/60. Показываем для p = 3:
    const n = DIESEL_PHYSICS.RADS_TO_RPM(omega);
    const f_50Hz_p3 = (n * 3) / 60; // Гц (если p = 3)

    return {
      M_gen: Math.round(M_gen),
      P_mech_kW: +(P_mech / 1000).toFixed(1),
      P_el_kW: +(P_el / 1000).toFixed(1),
      f_Hz: +f_50Hz_p3.toFixed(2),
    };
  }
}

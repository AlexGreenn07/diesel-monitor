import { DIESEL_PHYSICS } from "../../config/constants";
import type {
  IDrivetrain,
  DrivetrainInput,
  DrivetrainTelemetry,
} from "./IDrivetrain";

/**
 * Режим 1: Дизель без внешней нагрузки.
 * Нагрузка — только трение и навесные (учитываются в enginePhysics).
 * Здесь возвращаем 0.
 */
export class NoLoadDrivetrain implements IDrivetrain {
  readonly name = "Без нагрузки";

  getLoadTorque(_omega: number, _input: DrivetrainInput): number {
    void _omega;
    void _input;
    return 0;
  }

  getEffectiveInertia(): number {
    return DIESEL_PHYSICS.J;
  }

  getTelemetry(_omega: number, _input: DrivetrainInput): DrivetrainTelemetry {
    void _omega;
    void _input;
    return {};
  }
}

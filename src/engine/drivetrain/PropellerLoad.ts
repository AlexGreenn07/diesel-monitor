import { PROPELLER } from "../../config/constants";
import type {
  IDrivetrain,
  DrivetrainInput,
  DrivetrainTelemetry,
} from "./IDrivetrain";

/**
 * Режим 3: Дизель → редуктор → валолиния → винт.
 * ЗАГЛУШКА.
 */
export class PropellerDrivetrain implements IDrivetrain {
  readonly name = "Редуктор + Винт (заглушка)";

  getLoadTorque(_omega: number, _input: DrivetrainInput): number {
    void _omega;
    void _input;
    return 0;
  }

  getEffectiveInertia(): number {
    // TODO: реализовать на этапе 3
    void PROPELLER;
    return 0;
  }

  getTelemetry(_omega: number, _input: DrivetrainInput): DrivetrainTelemetry {
    void _omega;
    void _input;
    return { status: "not implemented" };
  }
}

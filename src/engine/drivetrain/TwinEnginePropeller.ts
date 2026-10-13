import type {
  IDrivetrain,
  DrivetrainInput,
  DrivetrainTelemetry,
} from "./IDrivetrain";

/**
 * Режим 4: Два дизеля → общий редуктор → валолиния → винт.
 * ЗАГЛУШКА.
 */
export class TwinEnginePropellerDrivetrain implements IDrivetrain {
  readonly name = "2×Дизель + Винт (заглушка)";

  getLoadTorque(_omega: number, _input: DrivetrainInput): number {
    void _omega;
    void _input;
    return 0;
  }

  getEffectiveInertia(): number {
    return 0;
  }

  getTelemetry(_omega: number, _input: DrivetrainInput): DrivetrainTelemetry {
    void _omega;
    void _input;
    return { status: "not implemented" };
  }
}

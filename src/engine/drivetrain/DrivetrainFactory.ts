import type { LoadMode } from "../../config/constants";
import type { IDrivetrain } from "./IDrivetrain";
import { NoLoadDrivetrain } from "./NoLoad";
import { GeneratorDrivetrain } from "./GeneratorLoad";
import { PropellerDrivetrain } from "./PropellerLoad";
import { TwinEnginePropellerDrivetrain } from "./TwinEnginePropeller";

/**
 * Фабрика режимов работы.
 * Возвращает нужную реализацию IDrivetrain по идентификатору.
 */
export function createDrivetrain(mode: LoadMode): IDrivetrain {
  switch (mode) {
    case "NONE":
      return new NoLoadDrivetrain();
    case "GENERATOR":
      return new GeneratorDrivetrain();
    case "PROPELLER":
      return new PropellerDrivetrain();
    case "TWIN_PROPELLER":
      return new TwinEnginePropellerDrivetrain();
    default:
      return new NoLoadDrivetrain();
  }
}

import { DIESEL_PHYSICS } from "../config/constants";

export interface PhysicsReport {
  newRpm: number;
  frictionLoad: number;
  auxLoad: number;
}

export class EnginePhysics {
  /**
   * Нагрузка от трения растет пропорционально КВАДРАТУ скорости (как в реальном ДВС)
   */
  public static calculateFriction(actualRpm: number): number {
    return Math.round(actualRpm * actualRpm * 0.0002);
  }

  /**
   * Постоянная нагрузка навесных помп и генератора
   */
  public static calculateAuxiliaryLoad(): number {
    return 40;
  }

  /**
   * Честный расчет изменения частоты вращения по уравнению моментов сил
   */
  public static getNextRpmReport(
    currentRpm: number,
    fuelValve: number,
    disturbance: number,
  ): PhysicsReport {
    // 1. Максимальный крутящий момент дизеля (в условных Н·м) равен 1200 ед.
    const MAX_TORQUE = 1200;

    // Крутящий момент двигателя прямо пропорционален выдвижению рейки ТНВД
    const engineTorque = (fuelValve / 100) * MAX_TORQUE;

    // 2. Рассчитываем силы сопротивления
    const frictionLoad = this.calculateFriction(currentRpm);
    const auxLoad = this.calculateAuxiliaryLoad();

    // Суммарный тормозящий момент (Винт + Трение + Навесные насосы)
    const totalResistance = disturbance + frictionLoad + auxLoad;

    console.log(
      `[PHYS] RPM=${currentRpm}, Fuel=${fuelValve}, Torque=${engineTorque}, Resist=${totalResistance}, Disturb=${disturbance}`,
    );

    // 3. Уравнение моментов Ньютона: Ускорение = (Момент двигателя - Момент сопротивления)
    // Если сопротивление больше момента двигателя, значение в скобках станет отрицательным,
    // и обороты начнут уменьшаться!
    let newRpm =
      currentRpm + (engineTorque - totalResistance) * DIESEL_PHYSICS.INERTIA;

    // Защита от отрицательных оборотов
    if (newRpm < 0) newRpm = 0;

    return {
      newRpm,
      frictionLoad,
      auxLoad,
    };
  }
}

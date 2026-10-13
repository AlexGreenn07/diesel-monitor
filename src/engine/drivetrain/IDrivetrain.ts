// ============================================================
// Интерфейс трансмиссии (нагрузки)
// ============================================================
// Каждый режим работы реализует этот интерфейс.
// enginePhysics вызывает getLoadTorque() и getEffectiveInertia(),
// чтобы получить момент нагрузки и приведённый J.
// ============================================================

export interface DrivetrainTelemetry {
  [key: string]: number | string;
}

export interface DrivetrainInput {
  omega: number; // рад/с — угловая скорость вала двигателя
  loadPct: number; // 0..100 — управляющий сигнал нагрузки
  stormFactor: number; // 0..1 — шторм (для винта; для генератора игнор)
  dt: number; // с — шаг интегрирования
}

export interface IDrivetrain {
  /** Название режима (для UI) */
  readonly name: string;

  /**
   * Приведённый к валу двигателя момент сопротивления.
   * [Н·м]
   */
  getLoadTorque(omega: number, input: DrivetrainInput): number;

  /**
   * Приведённый момент инерции для этого режима.
   * [кг·м²]
   */
  getEffectiveInertia(): number;

  /**
   * Дополнительная телеметрия для UI.
   */
  getTelemetry?(omega: number, input: DrivetrainInput): DrivetrainTelemetry;
}

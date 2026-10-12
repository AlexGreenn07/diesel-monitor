/**
 * Модуль генерации случайного волнового воздействия (морского волнения).
 */
export class WaveDisturbance {
  /**
   * Рассчитывает случайную штормовую составляющую нагрузки.
   * Если базовое воздействие равно 0, шум отключается автоматический.
   * @param baseDisturbance Базовое значение нагрузки с ползунка интерфейса
   * @param isEnabled Флаг включения случайного шума
   */
  public static generate(baseDisturbance: number, isEnabled: boolean): number {
    if (!isEnabled || baseDisturbance === 0) {
      return 0;
    }

    // Генерируем случайное отклонение волны в диапазоне от -10 до +10 единиц
    const waveNoise = Math.random() * 20 - 10;

    return waveNoise;
  }
}

/**
 * Генератор случайного волнового воздействия.
 * Пока используется только для режима PROPELLER (не реализован),
 * но оставлен для будущего.
 */
export class WaveDisturbance {
  /**
   * @param baseStorm  базовый шторм с ползунка, 0..1
   * @param isEnabled  включён ли случайный шум
   * @returns          полный stormFactor, 0..~1.5
   */
  public static generate(baseStorm: number, isEnabled: boolean): number {
    if (!isEnabled || baseStorm === 0) return baseStorm;
    const waveNoise = Math.random() * 0.5 - 0.25;
    return Math.max(0, Math.min(1.5, baseStorm + waveNoise));
  }
}

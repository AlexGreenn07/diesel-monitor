export const INITIAL_PID = {
  KP: 0.05,
  KI: 0.3,
  KD: 0.01,
};

export const CONTROL_LIMITS = {
  SETPOINT: { MIN: 0, MAX: 1500, STEP: 50, DEFAULT: 700 },
  DISTURBANCE: { MIN: 0, MAX: 400, STEP: 20, DEFAULT: 0 },
  WAVE_NOISE_DEFAULT: false, // По умолчанию случайный штормовой шум включен
  KP: { MIN: 0.1, MAX: 5.0, STEP: 0.1 },
  KI: { MIN: 0.0, MAX: 2.0, STEP: 0.1 },
  KD: { MIN: 0.0, MAX: 0.2, STEP: 0.01 },
};

export const DIESEL_PHYSICS = {
  DT: 0.001, // Шаг 5 миллисекунд
  INERTIA: 0.4, // Увеличили массу маховика, чтобы убрать моментальный прыжок оборотов
  MAX_RPM: 1500,
  DEADBAND_RPM: 1.0,
  ANTI_WINDUP_LIMIT: 500,
};

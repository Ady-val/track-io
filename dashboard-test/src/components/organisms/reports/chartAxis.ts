// Pasos "redondos" para ejes de tiempo (§C4): sin esto, Chart.js reparte el
// eje en múltiplos arbitrarios de segundos (1000 s, 2000 s…) que formateados a
// horas se leen como "2h 13m", "33m 20s" — números que nadie eligió.
const NICE_STEP_SECONDS: readonly number[] = [
  5 * 60,
  10 * 60,
  15 * 60,
  30 * 60,
  60 * 60,
  2 * 3600,
  4 * 3600,
  6 * 3600,
  12 * 3600,
  24 * 3600,
];

const SMALLEST_STEP = NICE_STEP_SECONDS[0] ?? 300;
const LARGEST_STEP =
  NICE_STEP_SECONDS[NICE_STEP_SECONDS.length - 1] ?? 24 * 3600;

/** Máximo del eje → paso redondo (15 min, 30 min, 1h…) con ~4-6 marcas. */
export function niceTimeStepSeconds(maxValue: number, targetTicks = 6): number {
  if (!(maxValue > 0)) return SMALLEST_STEP;

  return (
    NICE_STEP_SECONDS.find((step) => maxValue / step <= targetTicks) ??
    LARGEST_STEP
  );
}

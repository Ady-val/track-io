/**
 * Utilidades de tiempo de planta para el bucketing de reportes.
 *
 * Los buckets del dashboard (día/semana/mes) se calculan en CALENDARIO DE
 * PLANTA, no en UTC (Trampa 4): un paro a las 23:00 hora de planta es del lunes
 * aunque en UTC ya sea martes. Estas funciones replican la aritmética de zona
 * del ScheduledDowntimeCalculatorService, en forma pura y reutilizable.
 */

export type GroupBy = 'day' | 'month' | 'week';

export interface TimeBucket {
  label: string; // 'YYYY-MM-DD' (día/semana) | 'YYYY-MM' (mes)
  start: Date; // instante absoluto (inclusive)
  end: Date; // instante absoluto (exclusivo)
}

interface PlantDate {
  year: number;
  month: number; // 1-12
  day: number;
}

/** Fecha de calendario de la planta correspondiente a un instante absoluto. */
export function plantDateOf(instant: Date, timeZone: string): PlantDate {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const map: Record<string, number> = {};
  for (const part of dtf.formatToParts(instant)) {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  }
  return { year: map['year']!, month: map['month']!, day: map['day']! };
}

function offsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map: Record<string, number> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  }
  const asUTC = Date.UTC(
    map['year']!,
    map['month']! - 1,
    map['day'],
    map['hour']! % 24,
    map['minute'],
    map['second']
  );
  return asUTC - date.getTime();
}

/** Medianoche (00:00 hora de planta) de una fecha de calendario → instante. */
function plantMidnightToInstant(date: PlantDate, timeZone: string): Date {
  const guess = Date.UTC(date.year, date.month - 1, date.day, 0, 0);
  const o1 = offsetMs(new Date(guess), timeZone);
  let result = guess - o1;
  const o2 = offsetMs(new Date(result), timeZone);
  if (o2 !== o1) result = guess - o2;
  return new Date(result);
}

function addDays(date: PlantDate, days: number): PlantDate {
  const shifted = new Date(
    Date.UTC(date.year, date.month - 1, date.day + days)
  );
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function dayOfWeek(date: PlantDate): number {
  // 0 = domingo … 6 = sábado
  return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dayLabel(date: PlantDate): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

/**
 * Genera los buckets de [from, to] en calendario de planta. Los buckets se
 * generan aunque no tengan eventos (un día sin paros es un dato: 100% de
 * disponibilidad). Cada bucket queda recortado a [from, to].
 */
export function plantTimeBuckets(
  from: Date,
  to: Date,
  timeZone: string,
  groupBy: GroupBy
): TimeBucket[] {
  if (to.getTime() <= from.getTime()) {
    return [];
  }

  const buckets: TimeBucket[] = [];
  const fromMs = from.getTime();
  const toMs = to.getTime();

  // Fecha de planta donde arranca el primer bucket.
  let cursor = startOfBucket(plantDateOf(from, timeZone), groupBy);

  // Límite: no pasar del último instante del rango.
  let guard = 0;
  while (guard++ < 100_000) {
    const bucketStartInstant = plantMidnightToInstant(cursor, timeZone);
    const next = nextBucketStart(cursor, groupBy);
    const bucketEndInstant = plantMidnightToInstant(next, timeZone);

    if (bucketStartInstant.getTime() >= toMs) {
      break;
    }

    const clippedStart = Math.max(bucketStartInstant.getTime(), fromMs);
    const clippedEnd = Math.min(bucketEndInstant.getTime(), toMs);

    if (clippedEnd > clippedStart) {
      buckets.push({
        label: bucketLabel(cursor, groupBy),
        start: new Date(clippedStart),
        end: new Date(clippedEnd),
      });
    }

    cursor = next;
  }

  return buckets;
}

function startOfBucket(date: PlantDate, groupBy: GroupBy): PlantDate {
  if (groupBy === 'month') {
    return { year: date.year, month: date.month, day: 1 };
  }
  if (groupBy === 'week') {
    // Semana que arranca el lunes.
    const dow = dayOfWeek(date); // 0=domingo
    const backToMonday = dow === 0 ? 6 : dow - 1;
    return addDays(date, -backToMonday);
  }
  return date; // day
}

function nextBucketStart(date: PlantDate, groupBy: GroupBy): PlantDate {
  if (groupBy === 'month') {
    return date.month === 12
      ? { year: date.year + 1, month: 1, day: 1 }
      : { year: date.year, month: date.month + 1, day: 1 };
  }
  if (groupBy === 'week') {
    return addDays(date, 7);
  }
  return addDays(date, 1);
}

function bucketLabel(date: PlantDate, groupBy: GroupBy): string {
  if (groupBy === 'month') {
    return `${date.year}-${pad(date.month)}`;
  }
  return dayLabel(date); // día y semana usan la fecha de inicio
}

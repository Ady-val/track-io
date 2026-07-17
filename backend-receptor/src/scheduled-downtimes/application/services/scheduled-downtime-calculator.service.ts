import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduledDowntimeCacheService } from './scheduled-downtime-cache.service';
import type { ScheduledDowntime } from '../../domain/entities/scheduled-downtime.entity';

/**
 * Una rebanada disjunta de descuento por paro programado: una ocurrencia real
 * (con fecha) de una ventana, recortada al rango consultado y a lo ya cubierto
 * por otras rebanadas. Cada segundo de descuento pertenece a EXACTAMENTE una
 * rebanada (ver §2.3 del BUILD_SPEC_FASE2). Los campos `name`/`configured*` se
 * copian tal cual para poder congelarlos en el histórico.
 */
export interface ScheduledDowntimeSlice {
  scheduledDowntimeId: number;
  name: string;
  configuredStartTime: string; // 'HH:mm' — ventana configurada
  configuredEndTime: string; // 'HH:mm' — ventana configurada
  from: Date; // instante absoluto — el "de qué hora"
  to: Date; // instante absoluto — el "a qué hora"
  seconds: number;
}

export interface ScheduledDowntimeDiscount {
  timezone: string;
  /** Invariante: === Σ slices.seconds, incluso con paros traslapados (§9.1). */
  totalDiscountedSeconds: number;
  /** Rebanadas DISJUNTAS, ordenadas por `from`. */
  slices: ScheduledDowntimeSlice[];
}

/** Fecha de calendario de la planta (sin hora, sin zona). month: 1-12. */
interface PlantDate {
  year: number;
  month: number;
  day: number;
}

/** Candidato crudo antes del barrido disjunto. */
interface Candidate {
  downtime: ScheduledDowntime;
  startMs: number;
  endMs: number;
}

/**
 * Motor de cálculo de traslape entre un rango de tiempo real (evento cerrado,
 * AreaDowntime, evento abierto para escalamiento, o rango de reporte) y los
 * paros programados activos de un área.
 *
 * Sin estado, independiente del CRUD y de la capa HTTP. Consumidores:
 *  - SignalService.closeEvent()            → rebanadas por tramo (atención/solución)
 *  - AreaDowntimeService.endAreaDowntime() → snapshot del downtime del área
 *  - AlertCronService                      → minutos productivos para escalar
 *  - ReportsModule / recalculate           → agregados y trazabilidad por rango
 *
 * Decisiones de diseño (ver documentation):
 *  - Zona horaria: start_time/end_time son HORAS DE PARED de la planta.
 *  - Ventanas que cruzan medianoche: la recurrencia se ancla al DÍA DE INICIO
 *    (modelo DTSTART+DURATION de RFC 5545). Si endTime < startTime, cierra al
 *    día siguiente.
 *  - Unidad: segundos enteros.
 *  - Reparto DISJUNTO (§2.3): cada segundo lo posee un único paro programado,
 *    de forma determinista (orden por inicio, desempate por id ascendente).
 */
@Injectable()
export class ScheduledDowntimeCalculatorService {
  constructor(
    private readonly cache: ScheduledDowntimeCacheService,
    private readonly configService: ConfigService
  ) {}

  private get timezone(): string {
    return (
      this.configService.get<string>('plant.timezone') ?? 'America/Mexico_City'
    );
  }

  /**
   * Segundos de [rangeStart, rangeEnd) cubiertos por paros programados activos
   * del área. Deriva de getDiscount() para no tener dos fuentes de verdad:
   * === getDiscount().totalDiscountedSeconds (§9.1).
   */
  async getDiscountedSeconds(
    areaId: number,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<number> {
    const discount = await this.getDiscount(areaId, rangeStart, rangeEnd);
    return discount.totalDiscountedSeconds;
  }

  /** Segundos productivos = crudo − descuento. Nunca negativo. */
  async getEffectiveSeconds(
    areaId: number,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<number> {
    // Mismo truncado a segundo entero que getDiscount(): así el crudo y el
    // descuento viven en la misma retícula y la resta nunca produce el
    // artefacto de ±1 s (descuento > crudo en un evento totalmente cubierto).
    const rawSeconds = Math.max(
      0,
      Math.floor(rangeEnd.getTime() / 1000) -
        Math.floor(rangeStart.getTime() / 1000)
    );
    const discounted = await this.getDiscountedSeconds(
      areaId,
      rangeStart,
      rangeEnd
    );

    return Math.max(0, rawSeconds - discounted);
  }

  /**
   * Descuento con rebanadas disjuntas y trazables. Sustituye a la Fase 1:
   * en vez de un total colapsado, devuelve las ocurrencias reales (con fecha),
   * cada una atribuida a un único paro programado.
   */
  async getDiscount(
    areaId: number,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<ScheduledDowntimeDiscount> {
    const timezone = this.timezone;
    const empty: ScheduledDowntimeDiscount = {
      timezone,
      totalDiscountedSeconds: 0,
      slices: [],
    };

    if (rangeEnd.getTime() <= rangeStart.getTime()) {
      return empty;
    }

    const scheduledDowntimes = await this.cache.getActiveByAreaId(areaId);

    if (scheduledDowntimes.length === 0) {
      return empty;
    }

    // Los instantes del rango se TRUNCAN a segundo entero antes de intersectar.
    // Las ventanas del catálogo son minutos exactos, así que con el rango en la
    // misma retícula todas las rebanadas quedan en segundos exactos sin
    // redondeo: Σ tramos telescopia con el crudo (⌊cierre⌋ − ⌊inicio⌋) y la
    // identidad `efectivo = crudo − descuento` se preserva sin deriva de ±1 s.
    const rangeStartMs = Math.floor(rangeStart.getTime() / 1000) * 1000;
    const rangeEndMs = Math.floor(rangeEnd.getTime() / 1000) * 1000;
    if (rangeStartMs >= rangeEndMs) {
      return empty;
    }
    const candidates: Candidate[] = [];

    // El día ancla se recorre desde UN DÍA ANTES del inicio del rango: una
    // ventana que arranca el lunes 23:00 y cierra el martes 02:00 debe
    // considerarse aunque el rango empiece el martes 00:30.
    const firstAnchor = this.addDays(
      this.plantDateOf(rangeStart, timezone),
      -1
    );
    const lastAnchor = this.plantDateOf(rangeEnd, timezone);

    for (const anchor of this.eachPlantDay(firstAnchor, lastAnchor)) {
      const dayOfWeek = this.plantDayOfWeek(anchor);

      for (const downtime of scheduledDowntimes) {
        if (!downtime.daysOfWeek.includes(dayOfWeek)) {
          continue;
        }

        const windowStartMs = this.wallClockToInstant(
          anchor,
          downtime.startTime,
          timezone
        ).getTime();
        const endAnchor = this.crossesMidnight(downtime)
          ? this.addDays(anchor, 1)
          : anchor;
        const windowEndMs = this.wallClockToInstant(
          endAnchor,
          downtime.endTime,
          timezone
        ).getTime();

        const overlapStartMs = Math.max(rangeStartMs, windowStartMs);
        const overlapEndMs = Math.min(rangeEndMs, windowEndMs);

        if (overlapStartMs >= overlapEndMs) {
          continue;
        }

        candidates.push({
          downtime,
          startMs: overlapStartMs,
          endMs: overlapEndMs,
        });
      }
    }

    // Barrido disjunto (§2.3): orden por inicio; desempate por id ascendente
    // (determinista). Al recortar contra lo ya cubierto, cada segundo queda con
    // un dueño único y la unión total no cambia respecto a la Fase 1.
    candidates.sort(
      (a, b) => a.startMs - b.startMs || a.downtime.id - b.downtime.id
    );

    const slices: ScheduledDowntimeSlice[] = [];
    let coveredEndMs = -Infinity;

    for (const candidate of candidates) {
      const startMs = Math.max(candidate.startMs, coveredEndMs);
      const endMs = candidate.endMs;

      if (startMs >= endMs) {
        // Totalmente cubierto por rebanadas anteriores.
        continue;
      }

      const seconds = Math.round((endMs - startMs) / 1000);
      coveredEndMs = endMs;

      if (seconds <= 0) {
        // Sub-segundo tras redondeo: no aporta rebanada pero ya avanzó la
        // cobertura para no doble-contar.
        continue;
      }

      slices.push({
        scheduledDowntimeId: candidate.downtime.id,
        name: candidate.downtime.name,
        configuredStartTime: this.normalizeTime(candidate.downtime.startTime),
        configuredEndTime: this.normalizeTime(candidate.downtime.endTime),
        from: new Date(startMs),
        to: new Date(endMs),
        seconds,
      });
    }

    const totalDiscountedSeconds = slices.reduce(
      (sum, slice) => sum + slice.seconds,
      0
    );

    return { timezone, totalDiscountedSeconds, slices };
  }

  /**
   * Una ventana cruza medianoche cuando su hora de fin es menor que la de
   * inicio (ej. 23:00 → 02:00). El caso start == end se rechaza en el Service
   * por ambiguo (¿0 h o 24 h?), así que aquí no puede llegar.
   */
  private crossesMidnight(downtime: ScheduledDowntime): boolean {
    return (
      this.normalizeTime(downtime.endTime) <
      this.normalizeTime(downtime.startTime)
    );
  }

  /** Postgres devuelve `time` como 'HH:mm:ss'; la API los maneja como 'HH:mm'. */
  private normalizeTime(time: string): string {
    return time.slice(0, 5);
  }

  /** Fecha de calendario de la planta correspondiente a un instante absoluto. */
  private plantDateOf(instant: Date, timeZone: string): PlantDate {
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

    return {
      year: map['year']!,
      month: map['month']!,
      day: map['day']!,
    };
  }

  /** Día de la semana (0=domingo) de una fecha de calendario. */
  private plantDayOfWeek(date: PlantDate): number {
    return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  }

  private addDays(date: PlantDate, days: number): PlantDate {
    const shifted = new Date(
      Date.UTC(date.year, date.month - 1, date.day + days)
    );

    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
    };
  }

  private eachPlantDay(from: PlantDate, to: PlantDate): PlantDate[] {
    const days: PlantDate[] = [];
    let cursor = from;
    const limit = Date.UTC(to.year, to.month - 1, to.day);

    while (Date.UTC(cursor.year, cursor.month - 1, cursor.day) <= limit) {
      days.push(cursor);
      cursor = this.addDays(cursor, 1);
    }

    return days;
  }

  /** Hora de pared de la planta (fecha + 'HH:mm') → instante absoluto. */
  private wallClockToInstant(
    date: PlantDate,
    time: string,
    timeZone: string
  ): Date {
    const [hours, minutes] = this.normalizeTime(time).split(':').map(Number);
    const guess = Date.UTC(date.year, date.month - 1, date.day, hours, minutes);

    const offset1 = this.getTimeZoneOffsetMs(new Date(guess), timeZone);
    let result = guess - offset1;

    // Segunda pasada: cubre transiciones de horario de verano.
    const offset2 = this.getTimeZoneOffsetMs(new Date(result), timeZone);
    if (offset2 !== offset1) {
      result = guess - offset2;
    }

    return new Date(result);
  }

  /** Offset (ms) de una zona IANA en un instante dado. */
  private getTimeZoneOffsetMs(date: Date, timeZone: string): number {
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
}

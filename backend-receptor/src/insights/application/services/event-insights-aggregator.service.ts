import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { In, Repository } from 'typeorm';
import {
  Event,
  EventStatus,
} from '../../../events/domain/entities/event.entity';
import { EventAlertLog } from '../../../alert-escalation/domain/entities/event-alert-log.entity';
import { AlertLevel } from '../../../alert-escalation/domain/entities/alert-escalation-message.entity';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
import {
  plantTimeBuckets,
  type GroupBy,
  type TimeBucket,
} from '../../../reports/application/services/plant-time.util';
import type { AggregatedInsightsPayload } from '../../domain/types/aggregated-insights-payload.type';

const DEFAULT_TOP_SIGNALS = 10;
const MAX_BY_REASON_ROWS = 20;

export interface AggregatorRange {
  startDate: string;
  endDate: string;
  groupBy: GroupBy;
  areaId?: number;
}

/** Redondea a 1 decimal (evita floats crudos ensuciando el payload/prompt). */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function toMinutes(seconds: number): number {
  return round1(seconds / 60);
}

function pct(count: number, total: number): number {
  return total > 0 ? round1((count / total) * 100) : 0;
}

interface AreaDeptAcc {
  areaId: number;
  areaName: string;
  departmentId: number;
  departmentName: string;
  eventCount: number;
  totalMinutesSeconds: number;
  alertCount: number;
}

interface SignalAcc {
  signalId: number;
  signalName: string;
  areaName: string;
  departmentName: string;
  totalMinutesSeconds: number;
  eventCount: number;
  alertCount: number;
}

interface ReasonAcc {
  reason: string;
  eventCount: number;
  totalMinutesSeconds: number;
}

/**
 * Responsabilidad única: convertir un rango de fechas (+ área opcional) en un
 * AggregatedInsightsPayload. Nunca expone eventos individuales — todo lo que
 * sale de aquí ya está agregado. Es lo único que llega al modelo.
 */
@Injectable()
export class EventInsightsAggregator {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventAlertLog)
    private readonly eventAlertLogRepository: Repository<EventAlertLog>,
    private readonly areaRepository: AreaRepository,
    private readonly calculator: ScheduledDowntimeCalculatorService,
    private readonly configService: ConfigService
  ) {}

  private get timezone(): string {
    return (
      this.configService.get<string>('plant.timezone') ?? 'America/Mexico_City'
    );
  }

  async build(range: AggregatorRange): Promise<AggregatedInsightsPayload> {
    const from = new Date(range.startDate);
    const to = new Date(range.endDate);
    const days = Math.max(
      1,
      Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))
    );

    if (range.areaId) {
      const area = await this.areaRepository.findById(range.areaId);
      if (!area) {
        throw new NotFoundException(`Area with ID ${range.areaId} not found`);
      }
    }

    const events = await this.closedEventsInRange(from, to, range.areaId);
    const eventIds = events.map(e => e.id);
    const { alertEventIds, level2EventIds } =
      await this.loadEscalatedEventIds(eventIds);

    const totalDowntimeSeconds = events.reduce(
      (sum, e) => sum + (e.durationSeconds ?? 0),
      0
    );
    const totalDowntimeExcludingScheduledSeconds = events.reduce(
      (sum, e) => sum + (e.effectiveDurationSeconds ?? e.durationSeconds ?? 0),
      0
    );

    const totalActiveMinutes = await this.computeTotalActiveMinutes(
      from,
      to,
      range.areaId
    );

    const buckets = plantTimeBuckets(from, to, this.timezone, range.groupBy);

    return {
      range: {
        startDate: from.toISOString(),
        endDate: to.toISOString(),
        days,
        groupBy: range.groupBy,
        bucketCount: buckets.length,
        timezone: this.timezone,
      },
      totals: {
        totalEvents: events.length,
        totalActiveMinutes,
        totalDowntimeMinutes: toMinutes(totalDowntimeSeconds),
        totalDowntimeMinutesExcludingScheduled: toMinutes(
          totalDowntimeExcludingScheduledSeconds
        ),
        escalatedToAlertPct: pct(alertEventIds.size, events.length),
        escalatedToLevel2Pct: pct(level2EventIds.size, events.length),
      },
      byAreaDepartment: this.buildByAreaDepartment(events, alertEventIds),
      byPeriod: this.buildByPeriod(
        events,
        alertEventIds,
        buckets,
        range.groupBy
      ),
      byHourOfDay: this.buildByHourOfDay(events),
      byDayOfWeek: this.buildByDayOfWeek(events),
      byReason: this.buildByReason(events),
      topSignalsByDuration: this.buildTopSignals(events, alertEventIds),
      virtualDeviceSummary: this.buildVirtualDeviceSummary(events),
    };
  }

  private async closedEventsInRange(
    from: Date,
    to: Date,
    areaId?: number
  ): Promise<Event[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.status = :status', { status: EventStatus.CLOSED })
      .andWhere('event.closedAt >= :from', { from })
      .andWhere('event.closedAt <= :to', { to });

    if (areaId) {
      query.andWhere('event.areaId = :areaId', { areaId });
    }

    return query.getMany();
  }

  private async loadEscalatedEventIds(
    eventIds: number[]
  ): Promise<{ alertEventIds: Set<number>; level2EventIds: Set<number> }> {
    if (eventIds.length === 0) {
      return { alertEventIds: new Set(), level2EventIds: new Set() };
    }

    const logs = await this.eventAlertLogRepository.find({
      where: {
        eventId: In(eventIds),
        level: In([AlertLevel.ALERT, AlertLevel.ESCALATION2]),
      },
      select: ['eventId', 'level'],
    });

    const alertEventIds = new Set<number>();
    const level2EventIds = new Set<number>();
    for (const log of logs) {
      if (log.level === AlertLevel.ALERT) alertEventIds.add(log.eventId);
      if (log.level === AlertLevel.ESCALATION2) level2EventIds.add(log.eventId);
    }
    return { alertEventIds, level2EventIds };
  }

  /**
   * Minutos productivos (calendario − paro programado) de las áreas
   * involucradas. Si se filtró por área, solo esa; si no, todas las áreas de
   * la planta — igual que DowntimeReportService.buildSummary().
   */
  private async computeTotalActiveMinutes(
    from: Date,
    to: Date,
    areaId?: number
  ): Promise<number> {
    const areaIds = areaId
      ? [areaId]
      : (await this.areaRepository.findAll({})).data.map(a => a.id);

    const rangeSeconds = Math.max(
      0,
      Math.floor((to.getTime() - from.getTime()) / 1000)
    );
    let activeSeconds = 0;
    for (const id of areaIds) {
      const discounted = await this.calculator.getDiscountedSeconds(
        id,
        from,
        to
      );
      activeSeconds += Math.max(0, rangeSeconds - discounted);
    }
    return toMinutes(activeSeconds);
  }

  private eventDurationSeconds(event: Event): number {
    return event.effectiveDurationSeconds ?? event.durationSeconds ?? 0;
  }

  private buildByAreaDepartment(
    events: Event[],
    alertEventIds: Set<number>
  ): AggregatedInsightsPayload['byAreaDepartment'] {
    const map = new Map<string, AreaDeptAcc>();

    for (const event of events) {
      const key = `${event.areaId}:${event.departmentId}`;
      let acc = map.get(key);
      if (!acc) {
        acc = {
          areaId: event.areaId,
          areaName: event.areaName,
          departmentId: event.departmentId,
          departmentName: event.departmentName,
          eventCount: 0,
          totalMinutesSeconds: 0,
          alertCount: 0,
        };
        map.set(key, acc);
      }
      acc.eventCount += 1;
      acc.totalMinutesSeconds += this.eventDurationSeconds(event);
      if (alertEventIds.has(event.id)) acc.alertCount += 1;
    }

    return [...map.values()]
      .sort((a, b) => b.totalMinutesSeconds - a.totalMinutesSeconds)
      .map(acc => ({
        areaId: acc.areaId,
        areaName: acc.areaName,
        departmentId: acc.departmentId,
        departmentName: acc.departmentName,
        eventCount: acc.eventCount,
        totalMinutes: toMinutes(acc.totalMinutesSeconds),
        avgMinutes: toMinutes(acc.totalMinutesSeconds / acc.eventCount),
        escalatedToAlertPct: pct(acc.alertCount, acc.eventCount),
      }));
  }

  /**
   * Serie temporal a la granularidad de `groupBy`, en calendario de planta
   * (reusa `plantTimeBuckets`, la misma aritmética que usa Reportes). Cada
   * evento se ancla al bucket de su `closedAt` — coherente con el filtro de
   * rango de `closedEventsInRange()`, que también usa `closedAt`.
   */
  private buildByPeriod(
    events: Event[],
    alertEventIds: Set<number>,
    buckets: TimeBucket[],
    groupBy: GroupBy
  ): AggregatedInsightsPayload['byPeriod'] {
    return buckets.map((bucket, index) => {
      const isLast = index === buckets.length - 1;
      const bucketEvents = events.filter(event => {
        const anchor = (event.closedAt ?? event.createdAt).getTime();
        return (
          anchor >= bucket.start.getTime() &&
          (isLast
            ? anchor <= bucket.end.getTime()
            : anchor < bucket.end.getTime())
        );
      });
      const totalSeconds = bucketEvents.reduce(
        (sum, e) => sum + this.eventDurationSeconds(e),
        0
      );
      const alertCount = bucketEvents.filter(e =>
        alertEventIds.has(e.id)
      ).length;

      return {
        bucketStart: bucket.start.toISOString(),
        bucketLabel: this.periodLabel(bucket, groupBy),
        eventCount: bucketEvents.length,
        totalMinutes: toMinutes(totalSeconds),
        avgMinutes:
          bucketEvents.length > 0
            ? toMinutes(totalSeconds / bucketEvents.length)
            : 0,
        escalatedToAlertPct: pct(alertCount, bucketEvents.length),
      };
    });
  }

  private periodLabel(bucket: TimeBucket, groupBy: GroupBy): string {
    if (groupBy === 'month') {
      // formatToParts en vez de format(): evita el conector "de" que
      // Intl inserta en es-MX ("julio de 2026") — queremos "Julio 2026".
      const parts = new Intl.DateTimeFormat('es-MX', {
        month: 'long',
        year: 'numeric',
        timeZone: this.timezone,
      }).formatToParts(bucket.start);
      const month = parts.find(p => p.type === 'month')?.value ?? '';
      const year = parts.find(p => p.type === 'year')?.value ?? '';
      return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
    }
    if (groupBy === 'week') {
      return `Semana del ${bucket.label}`;
    }
    return bucket.label;
  }

  private plantHourAndDow(date: Date): { hour: number; dow: number } {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone,
      hour12: false,
      hour: '2-digit',
      weekday: 'short',
    });
    let hour = 0;
    let weekday = 'Sun';
    for (const part of dtf.formatToParts(date)) {
      if (part.type === 'hour') hour = Number(part.value) % 24;
      if (part.type === 'weekday') weekday = part.value;
    }
    const dowMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return { hour, dow: dowMap[weekday] ?? 0 };
  }

  private buildByHourOfDay(
    events: Event[]
  ): AggregatedInsightsPayload['byHourOfDay'] {
    const buckets = new Map<number, { count: number; seconds: number }>();
    for (const event of events) {
      const { hour } = this.plantHourAndDow(event.createdAt);
      const bucket = buckets.get(hour) ?? { count: 0, seconds: 0 };
      bucket.count += 1;
      bucket.seconds += this.eventDurationSeconds(event);
      buckets.set(hour, bucket);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([hour, b]) => ({
        hour,
        eventCount: b.count,
        avgMinutes: toMinutes(b.seconds / b.count),
      }));
  }

  private buildByDayOfWeek(
    events: Event[]
  ): AggregatedInsightsPayload['byDayOfWeek'] {
    const buckets = new Map<number, { count: number; seconds: number }>();
    for (const event of events) {
      const { dow } = this.plantHourAndDow(event.createdAt);
      const bucket = buckets.get(dow) ?? { count: 0, seconds: 0 };
      bucket.count += 1;
      bucket.seconds += this.eventDurationSeconds(event);
      buckets.set(dow, bucket);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([dow, b]) => ({
        dow,
        eventCount: b.count,
        avgMinutes: toMinutes(b.seconds / b.count),
      }));
  }

  /** Degrada con gracia: si nadie capturó `reason`, el bloque queda vacío. */
  private buildByReason(
    events: Event[]
  ): AggregatedInsightsPayload['byReason'] {
    const map = new Map<string, ReasonAcc>();
    for (const event of events) {
      const reason = event.reason?.trim();
      if (!reason) continue;
      let acc = map.get(reason);
      if (!acc) {
        acc = { reason, eventCount: 0, totalMinutesSeconds: 0 };
        map.set(reason, acc);
      }
      acc.eventCount += 1;
      acc.totalMinutesSeconds += this.eventDurationSeconds(event);
    }
    return [...map.values()]
      .sort((a, b) => b.totalMinutesSeconds - a.totalMinutesSeconds)
      .slice(0, MAX_BY_REASON_ROWS)
      .map(acc => ({
        reason: acc.reason,
        eventCount: acc.eventCount,
        totalMinutes: toMinutes(acc.totalMinutesSeconds),
      }));
  }

  private buildTopSignals(
    events: Event[],
    alertEventIds: Set<number>
  ): AggregatedInsightsPayload['topSignalsByDuration'] {
    const map = new Map<number, SignalAcc>();
    for (const event of events) {
      let acc = map.get(event.deviceSignalId);
      if (!acc) {
        acc = {
          signalId: event.deviceSignalId,
          signalName: event.deviceSignalName,
          areaName: event.areaName,
          departmentName: event.departmentName,
          totalMinutesSeconds: 0,
          eventCount: 0,
          alertCount: 0,
        };
        map.set(event.deviceSignalId, acc);
      }
      acc.eventCount += 1;
      acc.totalMinutesSeconds += this.eventDurationSeconds(event);
      if (alertEventIds.has(event.id)) acc.alertCount += 1;
    }

    const topN = this.topSignalsLimit();
    return [...map.values()]
      .sort((a, b) => b.totalMinutesSeconds - a.totalMinutesSeconds)
      .slice(0, topN)
      .map(acc => ({
        signalId: acc.signalId,
        signalName: acc.signalName,
        areaName: acc.areaName,
        departmentName: acc.departmentName,
        totalMinutes: toMinutes(acc.totalMinutesSeconds),
        eventCount: acc.eventCount,
        escalatedToAlertPct: pct(acc.alertCount, acc.eventCount),
      }));
  }

  private topSignalsLimit(): number {
    const raw = process.env['INSIGHTS_TOP_SIGNALS'];
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TOP_SIGNALS;
  }

  /** null si no hubo eventos de la botonera virtual en el periodo (§9). */
  private buildVirtualDeviceSummary(
    events: Event[]
  ): AggregatedInsightsPayload['virtualDeviceSummary'] {
    const virtualEvents = events.filter(e => e.virtualDevice);
    if (virtualEvents.length === 0) {
      return null;
    }
    const withReason = virtualEvents.filter(e => !!e.reason?.trim()).length;
    const withCloseComment = virtualEvents.filter(
      e => !!e.closeComment?.trim()
    ).length;
    return {
      eventCount: virtualEvents.length,
      withReasonPct: pct(withReason, virtualEvents.length),
      withCloseCommentPct: pct(withCloseComment, virtualEvents.length),
    };
  }
}

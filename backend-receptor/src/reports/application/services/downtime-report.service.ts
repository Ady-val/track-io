import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import {
  Event,
  EventStatus,
} from '../../../events/domain/entities/event.entity';
import { AreaDowntime } from '../../../area-downtime/domain/entities/area-downtime.entity';
import { EventScheduledDowntimeSlice } from '../../../events/domain/entities/event-scheduled-downtime-slice.entity';
import { EventScheduledDowntimeSliceRepository } from '../../../events/domain/repositories/event-scheduled-downtime-slice.repository';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
import { ScheduledDowntimeRepository } from '../../../scheduled-downtimes/domain/repositories/scheduled-downtime.repository';
import { plantTimeBuckets, type GroupBy } from './plant-time.util';
import type {
  DowntimeReport,
  DowntimeReportSummary,
  DowntimeReportDepartmentRow,
  DowntimeReportTrendRow,
  DowntimeReportQueryDto,
  EventReportQueryDto,
  EventReportResult,
  EventReportRow,
  EventReportSlice,
} from '../dtos/downtime-report.dto';

interface ScopeArea {
  id: number;
  name: string;
}

@Injectable()
export class DowntimeReportService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(AreaDowntime)
    private readonly areaDowntimeRepository: Repository<AreaDowntime>,
    private readonly areaRepository: AreaRepository,
    private readonly calculator: ScheduledDowntimeCalculatorService,
    private readonly scheduledDowntimeRepository: ScheduledDowntimeRepository,
    private readonly eventSliceRepository: EventScheduledDowntimeSliceRepository,
    private readonly configService: ConfigService
  ) {}

  private get timezone(): string {
    return (
      this.configService.get<string>('plant.timezone') ?? 'America/Mexico_City'
    );
  }

  // ==========================================================================
  // GET /reports/downtime
  // ==========================================================================

  async getDowntimeReport(
    dto: DowntimeReportQueryDto
  ): Promise<DowntimeReport> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    const groupBy: GroupBy = dto.groupBy ?? 'day';
    const timezone = this.timezone;
    const now = new Date();

    const areas = await this.resolveAreas(dto.areaId);
    const areaIds = areas.map(a => a.id);

    // Downtimes que intersectan [from, to] cargados UNA vez por área: los
    // reusan el summary y todos los buckets del trend (evita N×buckets queries).
    const downtimesByArea = await this.loadDowntimes(areaIds, from, to);

    const summary = await this.buildSummary(
      areaIds,
      from,
      to,
      downtimesByArea,
      now
    );
    const byDepartment = await this.buildByDepartment(areaIds, from, to);
    const trend = await this.buildTrend(
      areaIds,
      from,
      to,
      timezone,
      groupBy,
      downtimesByArea,
      now
    );

    return {
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
        timezone,
        groupBy,
      },
      scope: {
        areaId: dto.areaId ?? null,
        areaName: dto.areaId ? (areas[0]?.name ?? null) : null,
      },
      summary,
      byDepartment,
      trend,
    };
  }

  private async resolveAreas(areaId?: number): Promise<ScopeArea[]> {
    if (areaId) {
      const area = await this.areaRepository.findById(areaId);
      if (!area) {
        throw new NotFoundException(`Area with ID ${areaId} not found`);
      }
      return [{ id: area.id, name: area.name }];
    }
    const { data } = await this.areaRepository.findAll({});
    return data.map(a => ({ id: a.id, name: a.name }));
  }

  private async loadDowntimes(
    areaIds: number[],
    from: Date,
    to: Date
  ): Promise<Map<number, AreaDowntime[]>> {
    const map = new Map<number, AreaDowntime[]>();
    if (areaIds.length === 0) {
      return map;
    }
    const rows = await this.areaDowntimeRepository
      .createQueryBuilder('downtime')
      .where('downtime.areaId IN (:...areaIds)', { areaIds })
      .andWhere('downtime.startAt < :to', { to })
      .andWhere('(downtime.endsAt IS NULL OR downtime.endsAt > :from)', {
        from,
      })
      .getMany();

    for (const id of areaIds) {
      map.set(id, []);
    }
    for (const row of rows) {
      map.get(row.areaId)?.push(row);
    }
    return map;
  }

  /**
   * Paro no programado (efectivo) de un área en [from, to] a partir de sus
   * downtimes ya cargados. Trampas 2 (recorte en bordes) y 3 (activos):
   *  - Downtime contenido y cerrado → effective_duration_seconds precalculado.
   *  - Downtime que cruza un borde o activo → recálculo recortado a [from, to]
   *    (activos recortados a min(now, to)).
   * Los area_downtimes están deduplicados (no se traslapan), así que sumar es válido.
   */
  private async unplannedForArea(
    areaId: number,
    downtimes: AreaDowntime[],
    from: Date,
    to: Date,
    now: Date
  ): Promise<number> {
    const fromMs = from.getTime();
    const toMs = to.getTime();
    let total = 0;

    for (const downtime of downtimes) {
      const startMs = downtime.startAt.getTime();
      const endMs = (downtime.endsAt ?? now).getTime();

      // Descartar los que no intersectan este sub-rango (relevante en el trend).
      if (startMs >= toMs || endMs <= fromMs) {
        continue;
      }

      const contained =
        downtime.endsAt != null && startMs >= fromMs && endMs <= toMs;

      if (
        contained &&
        downtime.effectiveDurationSeconds != null &&
        endMs <= toMs
      ) {
        total += downtime.effectiveDurationSeconds;
        continue;
      }

      const clippedStartMs = Math.max(startMs, fromMs);
      const clippedEndMs = Math.min(endMs, toMs);
      if (clippedEndMs <= clippedStartMs) {
        continue;
      }
      const clippedStart = new Date(clippedStartMs);
      const clippedEnd = new Date(clippedEndMs);
      const rawClipped = Math.floor((clippedEndMs - clippedStartMs) / 1000);
      const discountClipped = await this.calculator.getDiscountedSeconds(
        areaId,
        clippedStart,
        clippedEnd
      );
      total += Math.max(0, rawClipped - discountClipped);
    }

    return total;
  }

  private async buildSummary(
    areaIds: number[],
    from: Date,
    to: Date,
    downtimesByArea: Map<number, AreaDowntime[]>,
    now: Date
  ): Promise<DowntimeReportSummary> {
    const rangeSeconds = Math.max(
      0,
      Math.floor((to.getTime() - from.getTime()) / 1000)
    );
    const calendarSeconds = rangeSeconds * areaIds.length;

    let scheduledDowntimeSeconds = 0;
    let unplannedDowntimeSeconds = 0;
    for (const areaId of areaIds) {
      // Trampa 1: el paro programado del KPI es el calculador sobre TODO el
      // rango, no la suma de los descuentos guardados en los eventos.
      scheduledDowntimeSeconds += await this.calculator.getDiscountedSeconds(
        areaId,
        from,
        to
      );
      unplannedDowntimeSeconds += await this.unplannedForArea(
        areaId,
        downtimesByArea.get(areaId) ?? [],
        from,
        to,
        now
      );
    }

    const plannedProductionSeconds = Math.max(
      0,
      calendarSeconds - scheduledDowntimeSeconds
    );
    const runSeconds = Math.max(
      0,
      plannedProductionSeconds - unplannedDowntimeSeconds
    );
    // Caso borde: sin tiempo productivo planeado, la disponibilidad NO está
    // definida (no es 0%: la línea no falló, no estaba programada para producir).
    const availability =
      plannedProductionSeconds > 0
        ? runSeconds / plannedProductionSeconds
        : null;

    const events = await this.closedEventsInRange(areaIds, from, to);
    const averages = this.computeAverages(events);
    const hasScheduledDowntimeConfigured =
      await this.anyScheduledConfigured(areaIds);

    return {
      calendarSeconds,
      scheduledDowntimeSeconds,
      plannedProductionSeconds,
      unplannedDowntimeSeconds,
      runSeconds,
      availability,
      eventCount: events.length,
      avgResponseSeconds: averages.avgResponse,
      avgResolutionSeconds: averages.avgResolution,
      hasScheduledDowntimeConfigured,
    };
  }

  private async closedEventsInRange(
    areaIds: number[],
    from: Date,
    to: Date
  ): Promise<Event[]> {
    if (areaIds.length === 0) {
      return [];
    }
    return this.eventRepository
      .createQueryBuilder('event')
      .where('event.status = :status', { status: EventStatus.CLOSED })
      .andWhere('event.areaId IN (:...areaIds)', { areaIds })
      .andWhere('event.closedAt >= :from', { from })
      .andWhere('event.closedAt <= :to', { to })
      .orderBy('event.closedAt', 'DESC')
      .getMany();
  }

  /**
   * Tiempos crudos (wall) y efectivos de atención/solución de un evento.
   * `null` si no fue atendido (sin `in_progress_at`) o no está cerrado.
   */
  private segmentTimes(event: Event): {
    responseSeconds: number;
    resolutionSeconds: number;
    effResponse: number;
    effResolution: number;
  } | null {
    if (!event.inProgressAt || !event.closedAt) {
      return null;
    }
    const responseSeconds = Math.max(
      0,
      Math.floor(
        (event.inProgressAt.getTime() - event.createdAt.getTime()) / 1000
      )
    );
    const resolutionSeconds = Math.max(
      0,
      Math.floor(
        (event.closedAt.getTime() - event.inProgressAt.getTime()) / 1000
      )
    );
    const responseDiscount = event.responseDiscountSeconds ?? 0;
    const resolutionDiscount =
      (event.scheduledDowntimeDiscountSeconds ?? 0) - responseDiscount;

    return {
      responseSeconds,
      resolutionSeconds,
      effResponse: Math.max(0, responseSeconds - responseDiscount),
      effResolution: Math.max(0, resolutionSeconds - resolutionDiscount),
    };
  }

  /**
   * Un evento entra al promedio de un tramo solo si hubo algo que medir:
   * `wall > 0 && effective === 0` significa que la ventana cayó ENTERA en
   * paro programado (fin de semana, comida) — no es "atendieron en 0
   * minutos", es que la pregunta no aplica. `wall === 0 && effective === 0`
   * SÍ es un cero real (atención/solución instantánea) y cuenta.
   * Los tramos se evalúan por separado: un evento puede excluirse de
   * atención y aun así contar en solución.
   */
  private includesInAverage(
    wallSeconds: number,
    effectiveSeconds: number
  ): boolean {
    return !(wallSeconds > 0 && effectiveSeconds === 0);
  }

  private computeAverages(events: Event[]): {
    avgResponse: number | null;
    avgResolution: number | null;
  } {
    let sumResponse = 0;
    let countResponse = 0;
    let sumResolution = 0;
    let countResolution = 0;

    for (const event of events) {
      const times = this.segmentTimes(event);
      if (!times) continue; // no atendido (§5.5)

      if (this.includesInAverage(times.responseSeconds, times.effResponse)) {
        sumResponse += times.effResponse;
        countResponse += 1;
      }
      if (
        this.includesInAverage(times.resolutionSeconds, times.effResolution)
      ) {
        sumResolution += times.effResolution;
        countResolution += 1;
      }
    }

    return {
      avgResponse:
        countResponse > 0 ? Math.round(sumResponse / countResponse) : null,
      avgResolution:
        countResolution > 0
          ? Math.round(sumResolution / countResolution)
          : null,
    };
  }

  private async anyScheduledConfigured(areaIds: number[]): Promise<boolean> {
    for (const areaId of areaIds) {
      const active =
        await this.scheduledDowntimeRepository.findActiveByAreaId(areaId);
      if (active.length > 0) {
        return true;
      }
    }
    return false;
  }

  private async buildByDepartment(
    areaIds: number[],
    from: Date,
    to: Date
  ): Promise<DowntimeReportDepartmentRow[]> {
    const events = await this.closedEventsInRange(areaIds, from, to);

    interface Acc {
      departmentId: number;
      departmentName: string;
      unplannedDowntimeSeconds: number;
      eventCount: number;
      responseSum: number;
      responseCount: number;
      resolutionSum: number;
      resolutionCount: number;
    }
    const byDept = new Map<number, Acc>();

    for (const event of events) {
      const deptId = event.departmentId;
      let acc = byDept.get(deptId);
      if (!acc) {
        acc = {
          departmentId: deptId,
          departmentName: event.departmentName,
          unplannedDowntimeSeconds: 0,
          eventCount: 0,
          responseSum: 0,
          responseCount: 0,
          resolutionSum: 0,
          resolutionCount: 0,
        };
        byDept.set(deptId, acc);
      }
      acc.unplannedDowntimeSeconds +=
        event.effectiveDurationSeconds ?? event.durationSeconds ?? 0;
      acc.eventCount += 1;

      const times = this.segmentTimes(event);
      if (times) {
        if (this.includesInAverage(times.responseSeconds, times.effResponse)) {
          acc.responseSum += times.effResponse;
          acc.responseCount += 1;
        }
        if (
          this.includesInAverage(times.resolutionSeconds, times.effResolution)
        ) {
          acc.resolutionSum += times.effResolution;
          acc.resolutionCount += 1;
        }
      }
    }

    const rows = [...byDept.values()].sort(
      (a, b) => b.unplannedDowntimeSeconds - a.unplannedDowntimeSeconds
    );

    const total = rows.reduce((sum, r) => sum + r.unplannedDowntimeSeconds, 0);
    let cumulative = 0;

    return rows.map(r => {
      cumulative += r.unplannedDowntimeSeconds;
      return {
        departmentId: r.departmentId,
        departmentName: r.departmentName,
        unplannedDowntimeSeconds: r.unplannedDowntimeSeconds,
        eventCount: r.eventCount,
        avgResponseSeconds:
          r.responseCount > 0
            ? Math.round(r.responseSum / r.responseCount)
            : null,
        avgResolutionSeconds:
          r.resolutionCount > 0
            ? Math.round(r.resolutionSum / r.resolutionCount)
            : null,
        cumulativePercent: total > 0 ? (cumulative / total) * 100 : 0,
      };
    });
  }

  private async buildTrend(
    areaIds: number[],
    from: Date,
    to: Date,
    timezone: string,
    groupBy: GroupBy,
    downtimesByArea: Map<number, AreaDowntime[]>,
    now: Date
  ): Promise<DowntimeReportTrendRow[]> {
    const buckets = plantTimeBuckets(from, to, timezone, groupBy);
    const trend: DowntimeReportTrendRow[] = [];

    for (const bucket of buckets) {
      const rangeSeconds = Math.max(
        0,
        Math.floor((bucket.end.getTime() - bucket.start.getTime()) / 1000)
      );
      const calendarSeconds = rangeSeconds * areaIds.length;

      let scheduled = 0;
      let unplanned = 0;
      for (const areaId of areaIds) {
        scheduled += await this.calculator.getDiscountedSeconds(
          areaId,
          bucket.start,
          bucket.end
        );
        unplanned += await this.unplannedForArea(
          areaId,
          downtimesByArea.get(areaId) ?? [],
          bucket.start,
          bucket.end,
          now
        );
      }

      const planned = Math.max(0, calendarSeconds - scheduled);
      const run = Math.max(0, planned - unplanned);

      trend.push({
        bucket: bucket.label,
        calendarSeconds,
        scheduledDowntimeSeconds: scheduled,
        unplannedDowntimeSeconds: unplanned,
        plannedProductionSeconds: planned,
        runSeconds: run,
        availability: planned > 0 ? run / planned : null,
      });
    }

    return trend;
  }

  // ==========================================================================
  // GET /reports/events
  // ==========================================================================

  async getEventReport(dto: EventReportQueryDto): Promise<EventReportResult> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    const limit = Math.min(dto.limit ?? 50, 100);
    const offset = dto.offset ?? 0;

    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.status = :status', { status: EventStatus.CLOSED })
      .andWhere('event.closedAt >= :from', { from })
      .andWhere('event.closedAt <= :to', { to });

    if (dto.areaId) {
      query.andWhere('event.areaId = :areaId', { areaId: dto.areaId });
    }
    if (dto.departmentId) {
      query.andWhere('event.departmentId = :departmentId', {
        departmentId: dto.departmentId,
      });
    }

    query.orderBy('event.closedAt', 'DESC');

    const total = await query.getCount();
    const events = await query.limit(limit).offset(offset).getMany();

    // Rebanadas de la página en UNA sola consulta (evita N+1).
    const eventIds = events.map(e => e.id);
    const slices = await this.eventSliceRepository.findByEventIds(eventIds);
    const slicesByEvent = new Map<number, EventScheduledDowntimeSlice[]>();
    for (const slice of slices) {
      const list = slicesByEvent.get(slice.eventId) ?? [];
      list.push(slice);
      slicesByEvent.set(slice.eventId, list);
    }

    const data: EventReportRow[] = events.map(event =>
      this.toEventRow(event, slicesByEvent.get(event.id) ?? [])
    );

    return {
      data,
      total,
      pagination: { limit, offset, total },
    };
  }

  private toEventRow(
    event: Event,
    slices: EventScheduledDowntimeSlice[]
  ): EventReportRow {
    const times = this.segmentTimes(event);
    const responseSeconds = times?.responseSeconds ?? null;
    const resolutionSeconds = times?.resolutionSeconds ?? null;
    const effResponse = times?.effResponse ?? null;
    const effResolution = times?.effResolution ?? null;

    const sliceRows: EventReportSlice[] = slices.map(slice => ({
      name: slice.name,
      configuredStartTime: slice.configuredStartTime.slice(0, 5),
      configuredEndTime: slice.configuredEndTime.slice(0, 5),
      occurredFrom: slice.occurredFrom.toISOString(),
      occurredTo: slice.occurredTo.toISOString(),
      seconds: slice.seconds,
      segment: slice.segment as 'resolution' | 'response',
    }));

    return {
      id: event.id,
      areaName: event.areaName,
      departmentName: event.departmentName,
      createdAt: event.createdAt.toISOString(),
      inProgressAt: event.inProgressAt?.toISOString() ?? null,
      closedAt: event.closedAt?.toISOString() ?? null,
      durationSeconds: event.durationSeconds ?? null,
      scheduledDowntimeDiscountSeconds:
        event.scheduledDowntimeDiscountSeconds ?? null,
      effectiveDurationSeconds: event.effectiveDurationSeconds ?? null,
      responseSeconds,
      effectiveResponseSeconds: effResponse,
      resolutionSeconds,
      effectiveResolutionSeconds: effResolution,
      virtualDevice: event.virtualDevice,
      reason: event.reason ?? null,
      comment: event.comment ?? null,
      virtualUserName: event.virtualUserName ?? null,
      progressComment: event.progressComment ?? null,
      closeComment: event.closeComment ?? null,
      scheduledDowntimeSlices: sliceRows,
    };
  }
}

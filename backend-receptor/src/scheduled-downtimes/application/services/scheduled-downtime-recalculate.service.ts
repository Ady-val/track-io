import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, type EntityManager } from 'typeorm';
import {
  Event,
  EventStatus,
} from '../../../events/domain/entities/event.entity';
import { AreaDowntime } from '../../../area-downtime/domain/entities/area-downtime.entity';
import {
  EventScheduledDowntimeSliceRepository,
  type CreateEventSliceDto,
} from '../../../events/domain/repositories/event-scheduled-downtime-slice.repository';
import { SliceSegment } from '../../../events/domain/entities/event-scheduled-downtime-slice.entity';
import {
  ScheduledDowntimeCalculatorService,
  type ScheduledDowntimeDiscount,
} from './scheduled-downtime-calculator.service';
import type {
  RecalculateDto,
  RecalculateResult,
} from '../dtos/recalculate.dto';

const BATCH_SIZE = 500;

interface EventRecalc {
  event: Event;
  newTotal: number;
  newResponse: number | null;
  newEffective: number;
  slices: CreateEventSliceDto[];
}

interface AreaDowntimeRecalc {
  downtime: AreaDowntime;
  newDiscount: number;
  newEffective: number;
  snapshot: ScheduledDowntimeDiscount;
}

/**
 * Recálculo retroactivo (§6): reescribe descuentos, efectivos y rebanadas de
 * los históricos CERRADOS que intersectan [from, to], usando el catálogo actual.
 * Red de seguridad ante horarios mal configurados; los datos están congelados
 * por diseño, así que sin esto la única vía sería tocar la BD a mano.
 *
 * Reglas duras:
 *  - NUNCA toca `duration_seconds`, `created_at`, `in_progress_at`, `closed_at`
 *    (hechos medidos) ni filas abiertas.
 *  - `dryRun` (default true) no escribe nada: solo reporta cuántas filas
 *    cambiarían y el delta agregado.
 *  - Procesa por lotes para no cargar meses en memoria.
 */
@Injectable()
export class ScheduledDowntimeRecalculateService {
  private readonly logger = new Logger(
    ScheduledDowntimeRecalculateService.name
  );

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(AreaDowntime)
    private readonly areaDowntimeRepository: Repository<AreaDowntime>,
    private readonly eventSliceRepository: EventScheduledDowntimeSliceRepository,
    private readonly calculator: ScheduledDowntimeCalculatorService,
    @InjectDataSource() private readonly dataSource: DataSource
  ) {}

  async recalculate(dto: RecalculateDto): Promise<RecalculateResult> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);
    const dryRun = dto.dryRun ?? true;

    const result: RecalculateResult = {
      dryRun,
      eventsAffected: 0,
      areaDowntimesAffected: 0,
      discountDeltaSeconds: 0,
      effectiveDeltaSeconds: 0,
    };

    await this.recalculateEvents(dto.areaId, from, to, dryRun, result);
    await this.recalculateAreaDowntimes(dto.areaId, from, to, dryRun, result);

    this.logger.log(
      `Recalculate (${dryRun ? 'dryRun' : 'apply'}): ` +
        `events=${result.eventsAffected}, areaDowntimes=${result.areaDowntimesAffected}, ` +
        `discountDelta=${result.discountDeltaSeconds}s, effectiveDelta=${result.effectiveDeltaSeconds}s`
    );

    return result;
  }

  // --------------------------------------------------------------------------
  // Eventos
  // --------------------------------------------------------------------------

  private async recalculateEvents(
    areaId: number | undefined,
    from: Date,
    to: Date,
    dryRun: boolean,
    result: RecalculateResult
  ): Promise<void> {
    let offset = 0;

    for (;;) {
      const query = this.eventRepository
        .createQueryBuilder('event')
        .where('event.status = :status', { status: EventStatus.CLOSED })
        // Intersección de [created_at, closed_at] con [from, to].
        .andWhere('event.createdAt < :to', { to })
        .andWhere('event.closedAt > :from', { from })
        .orderBy('event.id', 'ASC')
        .skip(offset)
        .take(BATCH_SIZE);

      if (areaId) {
        query.andWhere('event.areaId = :areaId', { areaId });
      }

      const events = await query.getMany();
      if (events.length === 0) {
        break;
      }

      const changed: EventRecalc[] = [];

      for (const event of events) {
        const recalc = await this.recalcEvent(event);
        if (!recalc) {
          continue;
        }

        const oldTotal = event.scheduledDowntimeDiscountSeconds ?? 0;
        const oldResponse = event.responseDiscountSeconds ?? null;
        const oldEffective =
          event.effectiveDurationSeconds ?? event.durationSeconds ?? 0;

        const numbersChanged =
          recalc.newTotal !== oldTotal ||
          recalc.newResponse !== oldResponse ||
          recalc.newEffective !== oldEffective;

        if (!numbersChanged) {
          continue;
        }

        result.eventsAffected += 1;
        result.discountDeltaSeconds += recalc.newTotal - oldTotal;
        result.effectiveDeltaSeconds += recalc.newEffective - oldEffective;
        changed.push(recalc);
      }

      if (!dryRun && changed.length > 0) {
        await this.persistEventBatch(changed);
      }

      if (events.length < BATCH_SIZE) {
        break;
      }
      // En dryRun no escribimos, así que el offset debe avanzar; al aplicar,
      // las filas cambian pero siguen matcheando el filtro, así que avanzar el
      // offset también es correcto (no reprocesamos porque el orden es estable).
      offset += BATCH_SIZE;
    }
  }

  /** Recalcula los dos tramos de un evento cerrado (§4.3). null si falla. */
  private async recalcEvent(event: Event): Promise<EventRecalc | null> {
    if (!event.closedAt) {
      return null;
    }

    try {
      const inProgressAt = event.inProgressAt ?? null;
      const slices: CreateEventSliceDto[] = [];
      let newResponse: number | null;
      let newTotal: number;

      if (inProgressAt) {
        const response = await this.calculator.getDiscount(
          event.areaId,
          event.createdAt,
          inProgressAt
        );
        const resolution = await this.calculator.getDiscount(
          event.areaId,
          inProgressAt,
          event.closedAt
        );
        newResponse = response.totalDiscountedSeconds;
        newTotal =
          response.totalDiscountedSeconds + resolution.totalDiscountedSeconds;
        slices.push(
          ...this.toSliceDtos(event.id, response, SliceSegment.RESPONSE),
          ...this.toSliceDtos(event.id, resolution, SliceSegment.RESOLUTION)
        );
      } else {
        const resolution = await this.calculator.getDiscount(
          event.areaId,
          event.createdAt,
          event.closedAt
        );
        newResponse = null;
        newTotal = resolution.totalDiscountedSeconds;
        slices.push(
          ...this.toSliceDtos(event.id, resolution, SliceSegment.RESOLUTION)
        );
      }

      const durationSeconds = event.durationSeconds ?? 0;
      const newEffective = Math.max(0, durationSeconds - newTotal);

      return { event, newTotal, newResponse, newEffective, slices };
    } catch (error) {
      this.logger.error(
        `Fallo al recalcular el evento ${event.id}; se omite: ${(error as Error).message}`
      );
      return null;
    }
  }

  private async persistEventBatch(changed: EventRecalc[]): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      const eventIds = changed.map(c => c.event.id);
      await this.eventSliceRepository.deleteByEventIds(eventIds, manager);

      for (const recalc of changed) {
        const updateData: Partial<Event> = {
          scheduledDowntimeDiscountSeconds: recalc.newTotal,
          effectiveDurationSeconds: recalc.newEffective,
        };
        if (recalc.newResponse !== null) {
          updateData.responseDiscountSeconds = recalc.newResponse;
        }
        await manager.update(Event, recalc.event.id, updateData);
        await this.eventSliceRepository.createMany(recalc.slices, manager);
      }
    });
  }

  // --------------------------------------------------------------------------
  // Area downtimes
  // --------------------------------------------------------------------------

  private async recalculateAreaDowntimes(
    areaId: number | undefined,
    from: Date,
    to: Date,
    dryRun: boolean,
    result: RecalculateResult
  ): Promise<void> {
    let offset = 0;

    for (;;) {
      const query = this.areaDowntimeRepository
        .createQueryBuilder('downtime')
        .where('downtime.endsAt IS NOT NULL')
        .andWhere('downtime.startAt < :to', { to })
        .andWhere('downtime.endsAt > :from', { from })
        .orderBy('downtime.id', 'ASC')
        .skip(offset)
        .take(BATCH_SIZE);

      if (areaId) {
        query.andWhere('downtime.areaId = :areaId', { areaId });
      }

      const downtimes = await query.getMany();
      if (downtimes.length === 0) {
        break;
      }

      const changed: AreaDowntimeRecalc[] = [];

      for (const downtime of downtimes) {
        const recalc = await this.recalcAreaDowntime(downtime);
        if (!recalc) {
          continue;
        }

        const oldDiscount = downtime.scheduledDowntimeDiscountSeconds ?? 0;
        const oldEffective =
          downtime.effectiveDurationSeconds ?? downtime.durationSeconds ?? 0;

        if (
          recalc.newDiscount === oldDiscount &&
          recalc.newEffective === oldEffective
        ) {
          continue;
        }

        result.areaDowntimesAffected += 1;
        result.discountDeltaSeconds += recalc.newDiscount - oldDiscount;
        result.effectiveDeltaSeconds += recalc.newEffective - oldEffective;
        changed.push(recalc);
      }

      if (!dryRun && changed.length > 0) {
        await this.persistAreaDowntimeBatch(changed);
      }

      if (downtimes.length < BATCH_SIZE) {
        break;
      }
      offset += BATCH_SIZE;
    }
  }

  private async recalcAreaDowntime(
    downtime: AreaDowntime
  ): Promise<AreaDowntimeRecalc | null> {
    if (!downtime.endsAt) {
      return null;
    }

    try {
      const snapshot = await this.calculator.getDiscount(
        downtime.areaId,
        downtime.startAt,
        downtime.endsAt
      );
      const durationSeconds =
        downtime.durationSeconds ??
        Math.max(
          0,
          Math.floor(
            (downtime.endsAt.getTime() - downtime.startAt.getTime()) / 1000
          )
        );
      const newDiscount = snapshot.totalDiscountedSeconds;
      const newEffective = Math.max(0, durationSeconds - newDiscount);

      return { downtime, newDiscount, newEffective, snapshot };
    } catch (error) {
      this.logger.error(
        `Fallo al recalcular el downtime ${downtime.id}; se omite: ${(error as Error).message}`
      );
      return null;
    }
  }

  private async persistAreaDowntimeBatch(
    changed: AreaDowntimeRecalc[]
  ): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      for (const recalc of changed) {
        await manager.update(AreaDowntime, recalc.downtime.id, {
          scheduledDowntimeDiscountSeconds: recalc.newDiscount,
          effectiveDurationSeconds: recalc.newEffective,
          scheduledDowntimeSnapshot: recalc.snapshot,
        });
      }
    });
  }

  private toSliceDtos(
    eventId: number,
    discount: ScheduledDowntimeDiscount,
    segment: SliceSegment
  ): CreateEventSliceDto[] {
    return discount.slices.map(slice => ({
      eventId,
      scheduledDowntimeId: slice.scheduledDowntimeId,
      name: slice.name,
      configuredStartTime: slice.configuredStartTime,
      configuredEndTime: slice.configuredEndTime,
      occurredFrom: slice.from,
      occurredTo: slice.to,
      seconds: slice.seconds,
      segment,
      timezone: discount.timezone,
    }));
  }
}

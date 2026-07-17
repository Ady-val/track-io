import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, type EntityManager } from 'typeorm';
import {
  EventScheduledDowntimeSlice,
  SliceSegment,
} from '../entities/event-scheduled-downtime-slice.entity';

export interface CreateEventSliceDto {
  eventId: number;
  scheduledDowntimeId: number;
  name: string;
  configuredStartTime: string;
  configuredEndTime: string;
  occurredFrom: Date;
  occurredTo: Date;
  seconds: number;
  segment: SliceSegment;
  timezone: string;
}

@Injectable()
export class EventScheduledDowntimeSliceRepository {
  constructor(
    @InjectRepository(EventScheduledDowntimeSlice)
    private readonly repository: Repository<EventScheduledDowntimeSlice>
  ) {}

  /**
   * Inserta rebanadas. Acepta un EntityManager para escribir dentro de la
   * transacción del cierre del evento (§4.3): evento + rebanadas atómicos.
   */
  async createMany(
    slices: CreateEventSliceDto[],
    manager?: EntityManager
  ): Promise<void> {
    if (slices.length === 0) {
      return;
    }
    const repo = manager
      ? manager.getRepository(EventScheduledDowntimeSlice)
      : this.repository;
    const entities = repo.create(slices);
    await repo.save(entities);
  }

  /** Borra las rebanadas de uno o varios eventos (para /recalculate). */
  async deleteByEventIds(
    eventIds: number[],
    manager?: EntityManager
  ): Promise<void> {
    if (eventIds.length === 0) {
      return;
    }
    const repo = manager
      ? manager.getRepository(EventScheduledDowntimeSlice)
      : this.repository;
    await repo.delete({ eventId: In(eventIds) });
  }

  /**
   * Trae en UNA sola consulta las rebanadas de una página de eventos
   * (`WHERE event_id IN (...)`), para evitar N+1 en el reporte de eventos.
   */
  async findByEventIds(
    eventIds: number[]
  ): Promise<EventScheduledDowntimeSlice[]> {
    if (eventIds.length === 0) {
      return [];
    }
    return this.repository.find({
      where: { eventId: In(eventIds) },
      order: { occurredFrom: 'ASC' },
    });
  }
}

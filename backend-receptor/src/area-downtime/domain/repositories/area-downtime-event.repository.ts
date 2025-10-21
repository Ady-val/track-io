import type { AreaDowntimeEvent } from '../entities/area-downtime-event.entity';

export interface CreateAreaDowntimeEventDto {
  areaDowntimeId: number;
  eventId: number;
}

export interface AreaDowntimeEventFilters {
  areaDowntimeId?: number;
  eventId?: number;
  limit?: number;
  offset?: number;
}

export interface AreaDowntimeEventRepository {
  create: (dto: CreateAreaDowntimeEventDto) => Promise<AreaDowntimeEvent>;
  findById: (id: number) => Promise<AreaDowntimeEvent | null>;
  findByAreaDowntimeId: (
    areaDowntimeId: number
  ) => Promise<AreaDowntimeEvent[]>;
  findByEventId: (eventId: number) => Promise<AreaDowntimeEvent[]>;
  findRelation: (
    areaDowntimeId: number,
    eventId: number
  ) => Promise<AreaDowntimeEvent | null>;
  findAll: (filters?: AreaDowntimeEventFilters) => Promise<{
    data: AreaDowntimeEvent[];
    total: number;
  }>;
  delete: (id: number) => Promise<void>;
  deleteByAreaDowntimeId: (areaDowntimeId: number) => Promise<void>;
  deleteByEventId: (eventId: number) => Promise<void>;
  count: (filters?: AreaDowntimeEventFilters) => Promise<number>;
}

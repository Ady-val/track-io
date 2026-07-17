import type { AreaDowntime } from '../entities/area-downtime.entity';

export interface CreateAreaDowntimeDto {
  areaId: number;
  startAt: Date;
  isActive?: boolean;
}

export interface UpdateAreaDowntimeDto {
  isActive?: boolean;
  endsAt?: Date;
  durationSeconds?: number;
  scheduledDowntimeDiscountSeconds?: number;
  effectiveDurationSeconds?: number;
  scheduledDowntimeSnapshot?: object | null;
}

export interface AreaDowntimeFilters {
  areaId?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AreaDowntimeRepository {
  create: (dto: CreateAreaDowntimeDto) => Promise<AreaDowntime>;
  findById: (id: number) => Promise<AreaDowntime | null>;
  findActiveByAreaId: (areaId: number) => Promise<AreaDowntime | null>;
  findAll: (filters?: AreaDowntimeFilters) => Promise<{
    data: AreaDowntime[];
    total: number;
  }>;
  update: (
    id: number,
    dto: UpdateAreaDowntimeDto
  ) => Promise<AreaDowntime | null>;
  findByAreaId: (areaId: number) => Promise<AreaDowntime[]>;
  isAreaInDowntime: (areaId: number) => Promise<boolean>;
  count: (filters?: AreaDowntimeFilters) => Promise<number>;
}

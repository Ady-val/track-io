import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledDowntime } from '../entities/scheduled-downtime.entity';

export interface CreateScheduledDowntimeDto {
  name: string;
  areaId: number;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isActive?: boolean;
}

export interface UpdateScheduledDowntimeDto {
  name?: string;
  areaId?: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isActive?: boolean;
}

export interface ScheduledDowntimeFilters {
  areaId?: number;
  isActive?: boolean;
  name?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

@Injectable()
export class ScheduledDowntimeRepository {
  constructor(
    @InjectRepository(ScheduledDowntime)
    private readonly scheduledDowntimeRepository: Repository<ScheduledDowntime>
  ) {}

  async create(
    createDto: CreateScheduledDowntimeDto
  ): Promise<ScheduledDowntime> {
    const scheduledDowntime =
      this.scheduledDowntimeRepository.create(createDto);
    return await this.scheduledDowntimeRepository.save(scheduledDowntime);
  }

  async findAll(filters: ScheduledDowntimeFilters = {}): Promise<{
    data: ScheduledDowntime[];
    total: number;
  }> {
    const queryBuilder =
      this.scheduledDowntimeRepository.createQueryBuilder('scheduledDowntime');

    if (!filters.includeDeleted) {
      queryBuilder.andWhere('scheduledDowntime.deletedAt IS NULL');
    }

    if (filters.areaId) {
      queryBuilder.andWhere('scheduledDowntime.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('scheduledDowntime.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.name) {
      queryBuilder.andWhere('scheduledDowntime.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    queryBuilder.orderBy('scheduledDowntime.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  /**
   * Paros programados activos (no borrados, isActive = true) de un área, sin
   * paginación: es el que consume el motor de cálculo de traslape.
   */
  async findActiveByAreaId(areaId: number): Promise<ScheduledDowntime[]> {
    return await this.scheduledDowntimeRepository.find({
      where: { areaId, isActive: true },
    });
  }

  async findById(id: number): Promise<ScheduledDowntime | null> {
    return await this.scheduledDowntimeRepository.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  async update(
    id: number,
    updateData: UpdateScheduledDowntimeDto
  ): Promise<ScheduledDowntime | null> {
    await this.scheduledDowntimeRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.scheduledDowntimeRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.scheduledDowntimeRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.scheduledDowntimeRepository.count();
  }
}

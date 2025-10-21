import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaDowntime } from '../entities/area-downtime.entity';
import {
  AreaDowntimeRepository,
  CreateAreaDowntimeDto,
  UpdateAreaDowntimeDto,
  AreaDowntimeFilters,
} from './area-downtime.repository';

@Injectable()
export class TypeOrmAreaDowntimeRepository implements AreaDowntimeRepository {
  constructor(
    @InjectRepository(AreaDowntime)
    private readonly repository: Repository<AreaDowntime>
  ) {}

  async create(dto: CreateAreaDowntimeDto): Promise<AreaDowntime> {
    const areaDowntime = this.repository.create(dto);
    return await this.repository.save(areaDowntime);
  }

  async findById(id: number): Promise<AreaDowntime | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['area'],
    });
  }

  async findActiveByAreaId(areaId: number): Promise<AreaDowntime | null> {
    return await this.repository.findOne({
      where: { areaId, isActive: true },
      relations: ['area'],
    });
  }

  async findAll({ limit = 10, ...filters }: AreaDowntimeFilters = {}): Promise<{
    data: AreaDowntime[];
    total: number;
  }> {
    const queryBuilder = this.repository.createQueryBuilder('areaDowntime');

    if (filters.areaId) {
      queryBuilder.andWhere('areaDowntime.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('areaDowntime.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('areaDowntime.startAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('areaDowntime.startAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder
      .leftJoinAndSelect('areaDowntime.area', 'area')
      .orderBy('areaDowntime.startAt', 'DESC');

    const total = await queryBuilder.getCount();

    queryBuilder.limit(limit);

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  async update(
    id: number,
    dto: UpdateAreaDowntimeDto
  ): Promise<AreaDowntime | null> {
    await this.repository.update(id, dto);
    return await this.findById(id);
  }

  async findByAreaId(areaId: number): Promise<AreaDowntime[]> {
    return await this.repository.find({
      where: { areaId },
      relations: ['area'],
      order: { startAt: 'DESC' },
    });
  }

  async isAreaInDowntime(areaId: number): Promise<boolean> {
    const activeDowntime = await this.findActiveByAreaId(areaId);
    return activeDowntime !== null;
  }

  async count(filters?: AreaDowntimeFilters): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('areaDowntime');

    if (filters?.areaId) {
      queryBuilder.andWhere('areaDowntime.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('areaDowntime.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('areaDowntime.startAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('areaDowntime.startAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return await queryBuilder.getCount();
  }
}

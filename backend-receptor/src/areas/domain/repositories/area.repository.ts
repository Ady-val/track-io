import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Area } from '../entities/area.entity';

export interface CreateAreaDto {
  name: string;
}

export interface UpdateAreaDto {
  name?: string;
}

export interface AreaFilters {
  name?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

@Injectable()
export class AreaRepository {
  constructor(
    @InjectRepository(Area)
    private readonly areaRepository: Repository<Area>
  ) {}

  async create(createAreaDto: CreateAreaDto): Promise<Area> {
    const area = this.areaRepository.create(createAreaDto);
    return await this.areaRepository.save(area);
  }

  async findAll(filters: AreaFilters = {}): Promise<{
    data: Area[];
    total: number;
  }> {
    const queryBuilder = this.areaRepository.createQueryBuilder('area');

    if (!filters.includeDeleted) {
      queryBuilder.andWhere('area.deletedAt IS NULL');
    }

    if (filters.name) {
      queryBuilder.andWhere('area.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    queryBuilder.orderBy('area.createdAt', 'DESC');

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

  async findById(id: number): Promise<Area | null> {
    return await this.areaRepository.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  async findByName(name: string): Promise<Area | null> {
    return await this.areaRepository.findOne({
      where: { name },
      withDeleted: false,
    });
  }

  async update(id: number, updateData: UpdateAreaDto): Promise<Area | null> {
    await this.areaRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.areaRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.areaRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.areaRepository.count({
      where: { deletedAt: IsNull() },
    });
  }
}

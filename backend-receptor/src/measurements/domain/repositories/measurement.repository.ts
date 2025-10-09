import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Measurement } from '../entities/measurement.entity';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from '../../application/dtos/measurement.dto';

export interface MeasurementFilters {
  externalId?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class MeasurementRepository {
  constructor(
    @InjectRepository(Measurement)
    private readonly measurementRepository: Repository<Measurement>
  ) {}

  async create(
    createMeasurementDto: CreateMeasurementDto
  ): Promise<Measurement> {
    const measurement = this.measurementRepository.create(createMeasurementDto);
    return await this.measurementRepository.save(measurement);
  }

  async findAll({ limit = 10, ...filters }: MeasurementFilters = {}): Promise<{
    data: Measurement[];
    total: number;
  }> {
    const queryBuilder =
      this.measurementRepository.createQueryBuilder('measurement');

    if (filters.externalId) {
      queryBuilder.andWhere('measurement.externalId = :externalId', {
        externalId: filters.externalId,
      });
    }

    if (filters.type) {
      queryBuilder.andWhere('measurement.type = :type', {
        type: filters.type,
      });
    }

    queryBuilder.orderBy('measurement.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    queryBuilder.limit(limit);

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  async findById(id: number): Promise<Measurement | null> {
    return await this.measurementRepository.findOne({ where: { id } });
  }

  async findByExternalId(externalId: string): Promise<Measurement | null> {
    return await this.measurementRepository.findOne({
      where: { externalId },
    });
  }

  async update(
    id: number,
    updateData: UpdateMeasurementDto
  ): Promise<Measurement | null> {
    await this.measurementRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.measurementRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.measurementRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.measurementRepository.count();
  }
}

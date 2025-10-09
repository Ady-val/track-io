import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RawMeasurement } from '../entities/raw-measurement.entity';

export interface CreateRawMeasurementDto {
  externalId: string;
  value: string;
}

export interface RawMeasurementFilters {
  externalId?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class RawMeasurementRepository {
  constructor(
    @InjectRepository(RawMeasurement)
    private readonly rawMeasurementRepository: Repository<RawMeasurement>
  ) {}

  async create(
    createRawMeasurementDto: CreateRawMeasurementDto
  ): Promise<RawMeasurement> {
    const rawMeasurement = this.rawMeasurementRepository.create(
      createRawMeasurementDto
    );
    return await this.rawMeasurementRepository.save(rawMeasurement);
  }

  async findAll({
    limit = 10,
    ...filters
  }: RawMeasurementFilters = {}): Promise<{
    data: RawMeasurement[];
    total: number;
  }> {
    const queryBuilder =
      this.rawMeasurementRepository.createQueryBuilder('rawMeasurement');

    if (filters.externalId) {
      queryBuilder.andWhere('rawMeasurement.externalId = :externalId', {
        externalId: filters.externalId,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('rawMeasurement.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('rawMeasurement.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('rawMeasurement.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    queryBuilder.limit(limit);

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  async findById(id: number): Promise<RawMeasurement | null> {
    return await this.rawMeasurementRepository.findOne({ where: { id } });
  }

  async findByExternalId(externalId: string): Promise<RawMeasurement[]> {
    return await this.rawMeasurementRepository.find({
      where: { externalId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    updateData: Partial<CreateRawMeasurementDto>
  ): Promise<RawMeasurement | null> {
    await this.rawMeasurementRepository.update(id, updateData);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.rawMeasurementRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.rawMeasurementRepository.count();
  }
}

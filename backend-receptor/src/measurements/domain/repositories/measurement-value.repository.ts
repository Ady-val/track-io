import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeasurementValue } from '../entities/measurement-value.entity';

export interface CreateMeasurementValueDto {
  measurementId: number;
  value: string;
}

@Injectable()
export class MeasurementValueRepository {
  constructor(
    @InjectRepository(MeasurementValue)
    private readonly measurementValueRepository: Repository<MeasurementValue>
  ) {}

  async create(
    createMeasurementValueDto: CreateMeasurementValueDto
  ): Promise<MeasurementValue> {
    const measurementValue = this.measurementValueRepository.create(
      createMeasurementValueDto
    );
    return await this.measurementValueRepository.save(measurementValue);
  }

  async findByMeasurementId(
    measurementId: number
  ): Promise<MeasurementValue[]> {
    return await this.measurementValueRepository.find({
      where: { measurementId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByMeasurementId(
    measurementId: number,
    limit: number = 10
  ): Promise<MeasurementValue[]> {
    return await this.measurementValueRepository.find({
      where: { measurementId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async count(): Promise<number> {
    return await this.measurementValueRepository.count();
  }
}

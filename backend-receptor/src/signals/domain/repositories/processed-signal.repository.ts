import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProcessedSignal } from '../entities/processed-signal.entity';

export interface CreateProcessedSignalDto {
  deviceId?: number;
  deviceName?: string;
  deviceSignalId?: number;
  deviceSignalName?: string;
}

export interface ProcessedSignalFilters {
  deviceId?: number;
  deviceSignalId?: number;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class ProcessedSignalRepository {
  constructor(
    @InjectRepository(ProcessedSignal)
    private readonly processedSignalRepository: Repository<ProcessedSignal>
  ) {}

  async create(
    createProcessedSignalDto: CreateProcessedSignalDto
  ): Promise<ProcessedSignal> {
    const processedSignal = this.processedSignalRepository.create(
      createProcessedSignalDto
    );
    return await this.processedSignalRepository.save(processedSignal);
  }

  async findAll({
    limit = 10,
    ...filters
  }: ProcessedSignalFilters = {}): Promise<{
    data: ProcessedSignal[];
    total: number;
  }> {
    const queryBuilder =
      this.processedSignalRepository.createQueryBuilder('processedSignal');

    if (filters.deviceId) {
      queryBuilder.andWhere('processedSignal.deviceId = :deviceId', {
        deviceId: filters.deviceId,
      });
    }

    if (filters.deviceSignalId) {
      queryBuilder.andWhere(
        'processedSignal.deviceSignalId = :deviceSignalId',
        {
          deviceSignalId: filters.deviceSignalId,
        }
      );
    }

    if (filters.startDate) {
      queryBuilder.andWhere('processedSignal.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('processedSignal.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('processedSignal.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    queryBuilder.limit(limit);

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  async findById(id: number): Promise<ProcessedSignal | null> {
    return await this.processedSignalRepository.findOne({ where: { id } });
  }

  async findByDeviceId(deviceId: number): Promise<ProcessedSignal[]> {
    return await this.processedSignalRepository.find({
      where: { deviceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByDeviceSignalId(
    deviceSignalId: number
  ): Promise<ProcessedSignal[]> {
    return await this.processedSignalRepository.find({
      where: { deviceSignalId },
      order: { createdAt: 'DESC' },
    });
  }

  async count(): Promise<number> {
    return await this.processedSignalRepository.count();
  }

  async countByDeviceId(deviceId: number): Promise<number> {
    return await this.processedSignalRepository.count({
      where: { deviceId },
    });
  }

  async countByDeviceSignalId(deviceSignalId: number): Promise<number> {
    return await this.processedSignalRepository.count({
      where: { deviceSignalId },
    });
  }
}





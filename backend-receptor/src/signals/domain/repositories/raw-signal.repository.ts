import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RawSignal } from '../entities/raw-signal.entity';

export interface CreateRawSignalDto {
  externalId: string;
  value: string;
  virtualDevice?: boolean;
  reason?: string;
  comment?: string;
}

export interface RawSignalFilters {
  externalId?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class RawSignalRepository {
  constructor(
    @InjectRepository(RawSignal)
    private readonly rawSignalRepository: Repository<RawSignal>
  ) {}

  async create(createRawSignalDto: CreateRawSignalDto): Promise<RawSignal> {
    const rawSignal = this.rawSignalRepository.create(createRawSignalDto);
    return await this.rawSignalRepository.save(rawSignal);
  }

  async findAll({ limit = 10, ...filters }: RawSignalFilters = {}): Promise<{
    data: RawSignal[];
    total: number;
  }> {
    const queryBuilder =
      this.rawSignalRepository.createQueryBuilder('rawSignal');

    if (filters.externalId) {
      queryBuilder.andWhere('rawSignal.externalId = :externalId', {
        externalId: filters.externalId,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('rawSignal.createdAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('rawSignal.createdAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('rawSignal.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    queryBuilder.limit(limit);

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  async findById(id: number): Promise<RawSignal | null> {
    return await this.rawSignalRepository.findOne({ where: { id } });
  }

  async findByExternalId(externalId: string): Promise<RawSignal[]> {
    return await this.rawSignalRepository.find({
      where: { externalId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    updateData: Partial<CreateRawSignalDto>
  ): Promise<RawSignal | null> {
    await this.rawSignalRepository.update(id, updateData);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.rawSignalRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.rawSignalRepository.count();
  }
}

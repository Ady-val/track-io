import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Device } from '../entities/device.entity';

export interface CreateDeviceDto {
  name: string;
  areaId: number;
  externalId: string;
}

export interface UpdateDeviceDto {
  name?: string;
  areaId?: number;
  externalId?: string;
}

export interface DeviceFilters {
  name?: string;
  areaId?: number;
  externalId?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

@Injectable()
export class DeviceRepository {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    const device = this.deviceRepository.create(createDeviceDto);
    return await this.deviceRepository.save(device);
  }

  async findAll(filters: DeviceFilters = {}): Promise<{
    data: Device[];
    total: number;
  }> {
    const queryBuilder = this.deviceRepository.createQueryBuilder('device');

    if (!filters.includeDeleted) {
      queryBuilder.andWhere('device.deletedAt IS NULL');
    }

    if (filters.name) {
      queryBuilder.andWhere('device.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.areaId) {
      queryBuilder.andWhere('device.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    if (filters.externalId) {
      queryBuilder.andWhere('device.externalId = :externalId', {
        externalId: filters.externalId,
      });
    }

    queryBuilder.orderBy('device.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    queryBuilder.leftJoinAndSelect('device.area', 'area');
    queryBuilder.leftJoinAndSelect(
      'device.deviceSignals',
      'deviceSignals',
      'deviceSignals.deletedAt IS NULL'
    );
    queryBuilder.leftJoinAndSelect('deviceSignals.department', 'department');

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  async findById(id: number): Promise<Device | null> {
    const device = await this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.area', 'area')
      .leftJoinAndSelect(
        'device.deviceSignals',
        'deviceSignals',
        'deviceSignals.deletedAt IS NULL'
      )
      .leftJoinAndSelect('deviceSignals.department', 'department')
      .where('device.id = :id', { id })
      .andWhere('device.deletedAt IS NULL')
      .getOne();
    return device;
  }

  async findByExternalId(externalId: string): Promise<Device | null> {
    const device = await this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.area', 'area')
      .leftJoinAndSelect(
        'device.deviceSignals',
        'deviceSignals',
        'deviceSignals.deletedAt IS NULL'
      )
      .leftJoinAndSelect('deviceSignals.department', 'department')
      .where('device.externalId = :externalId', { externalId })
      .andWhere('device.deletedAt IS NULL')
      .getOne();
    return device;
  }

  async findByAreaId(areaId: number): Promise<Device[]> {
    return await this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.area', 'area')
      .leftJoinAndSelect(
        'device.deviceSignals',
        'deviceSignals',
        'deviceSignals.deletedAt IS NULL'
      )
      .leftJoinAndSelect('deviceSignals.department', 'department')
      .where('device.areaId = :areaId', { areaId })
      .andWhere('device.deletedAt IS NULL')
      .orderBy('device.createdAt', 'DESC')
      .getMany();
  }

  async update(
    id: number,
    updateData: UpdateDeviceDto
  ): Promise<Device | null> {
    await this.deviceRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.deviceRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.deviceRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.deviceRepository.count({
      where: { deletedAt: IsNull() },
    });
  }

  async countByAreaId(areaId: number): Promise<number> {
    return await this.deviceRepository.count({
      where: { areaId, deletedAt: IsNull() },
    });
  }
}

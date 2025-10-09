import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { DeviceSignal } from '../entities/device-signal.entity';

export interface CreateDeviceSignalDto {
  name: string;
  deviceId: number;
  departmentId: number;
  externalValueId: string;
}

export interface UpdateDeviceSignalDto {
  name?: string;
  deviceId?: number;
  departmentId?: number;
  externalValueId?: string;
}

export interface DeviceSignalFilters {
  name?: string;
  deviceId?: number;
  departmentId?: number;
  externalValueId?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

@Injectable()
export class DeviceSignalRepository {
  constructor(
    @InjectRepository(DeviceSignal)
    private readonly deviceSignalRepository: Repository<DeviceSignal>
  ) {}

  async create(
    createDeviceSignalDto: CreateDeviceSignalDto
  ): Promise<DeviceSignal> {
    const deviceSignal = this.deviceSignalRepository.create(
      createDeviceSignalDto
    );
    return await this.deviceSignalRepository.save(deviceSignal);
  }

  async findAll(filters: DeviceSignalFilters = {}): Promise<{
    data: DeviceSignal[];
    total: number;
  }> {
    const queryBuilder =
      this.deviceSignalRepository.createQueryBuilder('deviceSignal');

    if (!filters.includeDeleted) {
      queryBuilder.andWhere('deviceSignal.deletedAt IS NULL');
    }

    if (filters.name) {
      queryBuilder.andWhere('deviceSignal.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters.deviceId) {
      queryBuilder.andWhere('deviceSignal.deviceId = :deviceId', {
        deviceId: filters.deviceId,
      });
    }

    if (filters.departmentId) {
      queryBuilder.andWhere('deviceSignal.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }

    if (filters.externalValueId) {
      queryBuilder.andWhere('deviceSignal.externalValueId = :externalValueId', {
        externalValueId: filters.externalValueId,
      });
    }

    queryBuilder.orderBy('deviceSignal.createdAt', 'DESC');

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

  async findById(id: number): Promise<DeviceSignal | null> {
    return await this.deviceSignalRepository.findOne({
      where: { id },
      withDeleted: false,
      relations: ['device', 'department'],
    });
  }

  async findByExternalValueId(
    externalValueId: string
  ): Promise<DeviceSignal | null> {
    return await this.deviceSignalRepository.findOne({
      where: { externalValueId },
      withDeleted: false,
      relations: ['device', 'department'],
    });
  }

  async findByDeviceId(deviceId: number): Promise<DeviceSignal[]> {
    return await this.deviceSignalRepository.find({
      where: { deviceId },
      withDeleted: false,
      relations: ['device', 'department'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDepartmentId(departmentId: number): Promise<DeviceSignal[]> {
    return await this.deviceSignalRepository.find({
      where: { departmentId },
      withDeleted: false,
      relations: ['device', 'department'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    updateData: UpdateDeviceSignalDto
  ): Promise<DeviceSignal | null> {
    await this.deviceSignalRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.deviceSignalRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.deviceSignalRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.deviceSignalRepository.count({
      where: { deletedAt: IsNull() },
    });
  }

  async countByDeviceId(deviceId: number): Promise<number> {
    return await this.deviceSignalRepository.count({
      where: { deviceId, deletedAt: IsNull() },
    });
  }

  async countByDepartmentId(departmentId: number): Promise<number> {
    return await this.deviceSignalRepository.count({
      where: { departmentId, deletedAt: IsNull() },
    });
  }
}

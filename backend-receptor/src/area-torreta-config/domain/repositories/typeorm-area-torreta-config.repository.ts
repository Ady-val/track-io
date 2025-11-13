import { Injectable } from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import { AreaTorretaConfig } from '../entities/area-torreta-config.entity';
import {
  AreaTorretaConfigRepository,
  CreateAreaTorretaConfigDto,
  UpdateAreaTorretaConfigDto,
  AreaTorretaConfigFilters,
} from './area-torreta-config.repository';

@Injectable()
export class TypeOrmAreaTorretaConfigRepository
  extends Repository<AreaTorretaConfig>
  implements AreaTorretaConfigRepository
{
  constructor(dataSource: DataSource) {
    super(AreaTorretaConfig, dataSource.createEntityManager());
  }

  async createConfig(
    dto: CreateAreaTorretaConfigDto
  ): Promise<AreaTorretaConfig> {
    const config = super.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return await this.save(config);
  }

  async findById(id: number): Promise<AreaTorretaConfig | null> {
    return await this.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async findByArea(areaId: number): Promise<AreaTorretaConfig[]> {
    return await this.find({
      where: { areaId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findByAreaAndTorreta(
    areaId: number,
    torretaExternalId: string
  ): Promise<AreaTorretaConfig | null> {
    return await this.findOne({
      where: {
        areaId,
        torretaExternalId,
        deletedAt: IsNull(),
      },
    });
  }

  async findAll(
    filters: AreaTorretaConfigFilters = {}
  ): Promise<AreaTorretaConfig[]> {
    const queryBuilder = this.createQueryBuilder('config');

    queryBuilder.where('config.deletedAt IS NULL');

    if (filters.areaId !== undefined) {
      queryBuilder.andWhere('config.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('config.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    queryBuilder.orderBy('config.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async updateConfig(
    id: number,
    dto: UpdateAreaTorretaConfigDto
  ): Promise<AreaTorretaConfig | null> {
    await super.update({ id, deletedAt: IsNull() }, dto);
    return await this.findById(id);
  }

  async softDeleteConfig(id: number): Promise<void> {
    await super.update({ id }, { deletedAt: new Date() });
  }

  async findActiveByArea(areaId: number): Promise<AreaTorretaConfig[]> {
    return await this.find({
      where: {
        areaId,
        isActive: true,
        deletedAt: IsNull(),
      },
    });
  }
}

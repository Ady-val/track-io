import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TypeOrmAreaTorretaConfigRepository } from '../../domain/repositories/typeorm-area-torreta-config.repository';
import { AreaTorretaConfig } from '../../domain/entities/area-torreta-config.entity';
import {
  CreateAreaTorretaConfigDto,
  UpdateAreaTorretaConfigDto,
} from '../dtos/area-torreta-config.dto';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import { TorretaRepository } from '../../../torretas/domain/repositories/torreta.repository';

@Injectable()
export class AreaTorretaConfigService {
  private readonly logger = new Logger(AreaTorretaConfigService.name);
  private areaRepository?: AreaRepository;
  private torretaRepository?: TorretaRepository;
  private areaTorretaConfigRepository?: TypeOrmAreaTorretaConfigRepository;

  constructor(private readonly moduleRef: ModuleRef) {}

  private getAreaTorretaConfigRepository(): TypeOrmAreaTorretaConfigRepository {
    if (!this.areaTorretaConfigRepository) {
      const repo = this.moduleRef.get(TypeOrmAreaTorretaConfigRepository, {
        strict: false,
      });

      if (!repo) {
        throw new Error(
          'TypeOrmAreaTorretaConfigRepository provider is not available'
        );
      }

      this.areaTorretaConfigRepository = repo;
    }

    return this.areaTorretaConfigRepository;
  }

  private getAreaRepository(): AreaRepository {
    if (!this.areaRepository) {
      const repo = this.moduleRef.get(AreaRepository, {
        strict: false,
      });

      if (!repo) {
        throw new Error('AreaRepository provider is not available');
      }

      this.areaRepository = repo;
    }

    return this.areaRepository;
  }

  private getTorretaRepository(): TorretaRepository {
    if (!this.torretaRepository) {
      const repo = this.moduleRef.get(TorretaRepository, {
        strict: false,
      });

      if (!repo) {
        throw new Error('TorretaRepository provider is not available');
      }

      this.torretaRepository = repo;
    }

    return this.torretaRepository;
  }

  async create(
    createDto: CreateAreaTorretaConfigDto
  ): Promise<AreaTorretaConfig> {
    const area = await this.getAreaRepository().findById(createDto.areaId);
    if (!area) {
      throw new NotFoundException(`Area with ID ${createDto.areaId} not found`);
    }

    const torreta = await this.getTorretaRepository().findOne({
      where: { externalId: createDto.torretaExternalId, isActive: true },
    });
    if (!torreta) {
      throw new NotFoundException(
        `Torreta with externalId ${createDto.torretaExternalId} not found or is inactive`
      );
    }

    const existing =
      await this.getAreaTorretaConfigRepository().findByAreaAndTorreta(
        createDto.areaId,
        createDto.torretaExternalId
      );
    if (existing) {
      throw new ConflictException(
        `Configuration already exists for area ${createDto.areaId} and torreta ${createDto.torretaExternalId}`
      );
    }

    try {
      const config =
        await this.getAreaTorretaConfigRepository().createConfig(createDto);
      this.logger.log(
        `Created area torreta config for area ${createDto.areaId} and torreta ${createDto.torretaExternalId}`
      );
      return config;
    } catch (error) {
      this.logger.error(
        `Error creating area torreta config: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAllByArea(areaId: number): Promise<AreaTorretaConfig[]> {
    return await this.getAreaTorretaConfigRepository().findByArea(areaId);
  }

  async findById(id: number): Promise<AreaTorretaConfig> {
    const config = await this.getAreaTorretaConfigRepository().findById(id);
    if (!config) {
      throw new NotFoundException(`AreaTorretaConfig with ID ${id} not found`);
    }
    return config;
  }

  async update(
    id: number,
    updateDto: UpdateAreaTorretaConfigDto
  ): Promise<AreaTorretaConfig> {
    await this.findById(id);
    const updated = await this.getAreaTorretaConfigRepository().updateConfig(
      id,
      updateDto
    );
    if (!updated) {
      throw new NotFoundException(`AreaTorretaConfig with ID ${id} not found`);
    }
    this.logger.log(`Updated area torreta config with ID ${id}`);
    return updated;
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.getAreaTorretaConfigRepository().softDeleteConfig(id);
    this.logger.log(`Deleted area torreta config with ID ${id}`);
  }

  async findActiveByArea(areaId: number): Promise<AreaTorretaConfig[]> {
    return await this.getAreaTorretaConfigRepository().findActiveByArea(areaId);
  }
}

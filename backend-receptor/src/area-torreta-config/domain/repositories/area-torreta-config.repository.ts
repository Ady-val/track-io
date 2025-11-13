import {
  AreaTorretaConfig,
  TorretaConfigurationType,
} from '../entities/area-torreta-config.entity';

export interface CreateAreaTorretaConfigDto {
  areaId: number;
  torretaExternalId: string;
  configurationType: TorretaConfigurationType;
  isActive?: boolean;
}

export interface UpdateAreaTorretaConfigDto {
  configurationType?: TorretaConfigurationType;
  isActive?: boolean;
}

export interface AreaTorretaConfigFilters {
  areaId?: number;
  isActive?: boolean;
}

export interface AreaTorretaConfigRepository {
  createConfig: (dto: CreateAreaTorretaConfigDto) => Promise<AreaTorretaConfig>;
  findById: (id: number) => Promise<AreaTorretaConfig | null>;
  findByArea: (areaId: number) => Promise<AreaTorretaConfig[]>;
  findByAreaAndTorreta: (
    areaId: number,
    torretaExternalId: string
  ) => Promise<AreaTorretaConfig | null>;
  findAll: (filters?: AreaTorretaConfigFilters) => Promise<AreaTorretaConfig[]>;
  updateConfig: (
    id: number,
    dto: UpdateAreaTorretaConfigDto
  ) => Promise<AreaTorretaConfig | null>;
  softDeleteConfig: (id: number) => Promise<void>;
  findActiveByArea: (areaId: number) => Promise<AreaTorretaConfig[]>;
}

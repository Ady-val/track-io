import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AreaTorretaConfigService } from './area-torreta-config.service';
import { TypeOrmAreaTorretaConfigRepository } from '../../domain/repositories/typeorm-area-torreta-config.repository';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import { TorretaRepository } from '../../../torretas/domain/repositories/torreta.repository';
import {
  createMockAreaTorretaConfig,
  createMockArea,
  createMockTorreta,
} from '../../../test-helpers';
import { TorretaConfigurationType } from '../../domain/entities/area-torreta-config.entity';
import type {
  CreateAreaTorretaConfigDto,
  UpdateAreaTorretaConfigDto,
} from '../dtos/area-torreta-config.dto';

describe('AreaTorretaConfigService', () => {
  let service: AreaTorretaConfigService;
  let areaTorretaConfigRepository: jest.Mocked<TypeOrmAreaTorretaConfigRepository>;
  let areaRepository: jest.Mocked<AreaRepository>;
  let torretaRepository: jest.Mocked<TorretaRepository>;

  beforeEach(async () => {
    const mockAreaTorretaConfigRepository = {
      createConfig: jest.fn(),
      findById: jest.fn(),
      findByArea: jest.fn(),
      findByAreaAndTorreta: jest.fn(),
      updateConfig: jest.fn(),
      softDeleteConfig: jest.fn(),
      findActiveByArea: jest.fn(),
    };

    const mockAreaRepository = {
      findById: jest.fn(),
    };

    const mockTorretaRepository = {
      findOne: jest.fn(),
    };

    const mockModuleRef = {
      get: jest.fn((token: unknown) => {
        if (token === TypeOrmAreaTorretaConfigRepository) {
          return mockAreaTorretaConfigRepository;
        }
        if (token === AreaRepository) {
          return mockAreaRepository;
        }
        if (token === TorretaRepository) {
          return mockTorretaRepository;
        }
        return null;
      }),
    } as jest.Mocked<ModuleRef>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaTorretaConfigService,
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
      ],
    }).compile();

    service = module.get<AreaTorretaConfigService>(AreaTorretaConfigService);
    areaTorretaConfigRepository =
      mockAreaTorretaConfigRepository as jest.Mocked<TypeOrmAreaTorretaConfigRepository>;
    areaRepository = mockAreaRepository as jest.Mocked<AreaRepository>;
    torretaRepository = mockTorretaRepository as jest.Mocked<TorretaRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create config successfully', async () => {
      const createDto: CreateAreaTorretaConfigDto = {
        areaId: 1,
        torretaExternalId: 'TORRETA001',
        configurationType: TorretaConfigurationType.AREA,
      };
      const mockArea = createMockArea({ id: 1 });
      const mockTorreta = createMockTorreta({
        id: 1,
        externalId: 'TORRETA001',
        isActive: true,
      });
      const mockConfig = createMockAreaTorretaConfig({ id: 1, ...createDto });

      areaRepository.findById.mockResolvedValue(mockArea);
      torretaRepository.findOne.mockResolvedValue(mockTorreta);
      areaTorretaConfigRepository.findByAreaAndTorreta.mockResolvedValue(null);
      areaTorretaConfigRepository.createConfig.mockResolvedValue(mockConfig);

      const result = await service.create(createDto);

      expect(result).toEqual(mockConfig);
      expect(areaRepository.findById).toHaveBeenCalledWith(1);
      expect(torretaRepository.findOne).toHaveBeenCalledWith({
        where: { externalId: 'TORRETA001', isActive: true },
      });
      expect(
        areaTorretaConfigRepository.findByAreaAndTorreta
      ).toHaveBeenCalledWith(1, 'TORRETA001');
      expect(areaTorretaConfigRepository.createConfig).toHaveBeenCalledWith(
        createDto
      );
    });

    it('should throw NotFoundException when area does not exist', async () => {
      const createDto: CreateAreaTorretaConfigDto = {
        areaId: 999,
        torretaExternalId: 'TORRETA001',
        configurationType: TorretaConfigurationType.AREA,
      };

      areaRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Area with ID ${createDto.areaId} not found`
      );
    });

    it('should throw NotFoundException when torreta does not exist or is inactive', async () => {
      const createDto: CreateAreaTorretaConfigDto = {
        areaId: 1,
        torretaExternalId: 'TORRETA999',
        configurationType: TorretaConfigurationType.AREA,
      };
      const mockArea = createMockArea({ id: 1 });

      areaRepository.findById.mockResolvedValue(mockArea);
      torretaRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Torreta with externalId ${createDto.torretaExternalId} not found or is inactive`
      );
    });

    it('should throw ConflictException when config already exists', async () => {
      const createDto: CreateAreaTorretaConfigDto = {
        areaId: 1,
        torretaExternalId: 'TORRETA001',
        configurationType: TorretaConfigurationType.AREA,
      };
      const mockArea = createMockArea({ id: 1 });
      const mockTorreta = createMockTorreta({
        id: 1,
        externalId: 'TORRETA001',
        isActive: true,
      });
      const existingConfig = createMockAreaTorretaConfig({ id: 1 });

      areaRepository.findById.mockResolvedValue(mockArea);
      torretaRepository.findOne.mockResolvedValue(mockTorreta);
      areaTorretaConfigRepository.findByAreaAndTorreta.mockResolvedValue(
        existingConfig
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        `Configuration already exists for area ${createDto.areaId} and torreta ${createDto.torretaExternalId}`
      );
    });
  });

  describe('findAllByArea', () => {
    it('should return configs for area', async () => {
      const areaId = 1;
      const mockConfigs = [
        createMockAreaTorretaConfig({ id: 1, areaId }),
        createMockAreaTorretaConfig({ id: 2, areaId }),
      ];

      areaTorretaConfigRepository.findByArea.mockResolvedValue(mockConfigs);

      const result = await service.findAllByArea(areaId);

      expect(result).toEqual(mockConfigs);
      expect(areaTorretaConfigRepository.findByArea).toHaveBeenCalledWith(
        areaId
      );
    });
  });

  describe('findById', () => {
    it('should return config when exists', async () => {
      const id = 1;
      const mockConfig = createMockAreaTorretaConfig({ id });

      areaTorretaConfigRepository.findById.mockResolvedValue(mockConfig);

      const result = await service.findById(id);

      expect(result).toEqual(mockConfig);
      expect(areaTorretaConfigRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when config does not exist', async () => {
      const id = 999;
      areaTorretaConfigRepository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `AreaTorretaConfig with ID ${id} not found`
      );
    });
  });

  describe('update', () => {
    it('should update config successfully', async () => {
      const id = 1;
      const updateDto: UpdateAreaTorretaConfigDto = {
        isActive: false,
      };
      const existingConfig = createMockAreaTorretaConfig({ id });
      const updatedConfig = createMockAreaTorretaConfig({
        id,
        isActive: false,
      });

      areaTorretaConfigRepository.findById.mockResolvedValue(existingConfig);
      areaTorretaConfigRepository.updateConfig.mockResolvedValue(updatedConfig);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedConfig);
      expect(areaTorretaConfigRepository.findById).toHaveBeenCalledWith(id);
      expect(areaTorretaConfigRepository.updateConfig).toHaveBeenCalledWith(
        id,
        updateDto
      );
    });

    it('should throw NotFoundException when config does not exist', async () => {
      const id = 999;
      const updateDto: UpdateAreaTorretaConfigDto = { isActive: false };

      areaTorretaConfigRepository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('delete', () => {
    it('should delete config successfully', async () => {
      const id = 1;
      const existingConfig = createMockAreaTorretaConfig({ id });

      areaTorretaConfigRepository.findById.mockResolvedValue(existingConfig);
      areaTorretaConfigRepository.softDeleteConfig.mockResolvedValue(undefined);

      await service.delete(id);

      expect(areaTorretaConfigRepository.findById).toHaveBeenCalledWith(id);
      expect(areaTorretaConfigRepository.softDeleteConfig).toHaveBeenCalledWith(
        id
      );
    });
  });

  describe('findActiveByArea', () => {
    it('should return only active configs for area', async () => {
      const areaId = 1;
      const mockConfigs = [
        createMockAreaTorretaConfig({ id: 1, areaId, isActive: true }),
      ];

      areaTorretaConfigRepository.findActiveByArea.mockResolvedValue(
        mockConfigs
      );

      const result = await service.findActiveByArea(areaId);

      expect(result).toEqual(mockConfigs);
      expect(areaTorretaConfigRepository.findActiveByArea).toHaveBeenCalledWith(
        areaId
      );
    });
  });
});

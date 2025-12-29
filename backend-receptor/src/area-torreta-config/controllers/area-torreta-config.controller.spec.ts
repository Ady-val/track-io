import { Test, type TestingModule } from '@nestjs/testing';
import { AreaTorretaConfigController } from './area-torreta-config.controller';
import { AreaTorretaConfigService } from '../application/services/area-torreta-config.service';
import { createMockAreaTorretaConfig } from '../../test-helpers';

describe('AreaTorretaConfigController', () => {
  let controller: AreaTorretaConfigController;
  let service: jest.Mocked<AreaTorretaConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreaTorretaConfigController],
      providers: [
        {
          provide: AreaTorretaConfigService,
          useValue: {
            create: jest.fn(),
            findAllByArea: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AreaTorretaConfigController>(
      AreaTorretaConfigController
    );
    service = module.get(AreaTorretaConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create config successfully', async () => {
      const createDto = {
        areaId: 1,
        torretaExternalId: 'TORRETA001',
        configurationType: 'area' as const,
      };
      const mockConfig = createMockAreaTorretaConfig({ id: 1, ...createDto });

      service.create.mockResolvedValue(mockConfig);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        message: 'Area torreta config created successfully',
        data: mockConfig,
      });
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAllByArea', () => {
    it('should return configs for area', async () => {
      const areaId = 1;
      const mockConfigs = [
        createMockAreaTorretaConfig({ id: 1, areaId }),
        createMockAreaTorretaConfig({ id: 2, areaId }),
      ];

      service.findAllByArea.mockResolvedValue(mockConfigs);

      const result = await controller.findAllByArea(areaId);

      expect(result).toEqual({
        message: 'Area torreta configs retrieved successfully',
        data: mockConfigs,
      });
      expect(service.findAllByArea).toHaveBeenCalledWith(areaId);
    });
  });

  describe('findById', () => {
    it('should return config by ID', async () => {
      const id = 1;
      const mockConfig = createMockAreaTorretaConfig({ id });

      service.findById.mockResolvedValue(mockConfig);

      const result = await controller.findById(id);

      expect(result).toEqual({
        message: 'Area torreta config retrieved successfully',
        data: mockConfig,
      });
      expect(service.findById).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update config successfully', async () => {
      const id = 1;
      const updateDto = { isActive: false };
      const updatedConfig = createMockAreaTorretaConfig({
        id,
        isActive: false,
      });

      service.update.mockResolvedValue(updatedConfig);

      const result = await controller.update(id, updateDto);

      expect(result).toEqual({
        message: 'Area torreta config updated successfully',
        data: updatedConfig,
      });
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('delete', () => {
    it('should delete config successfully', async () => {
      const id = 1;
      service.delete.mockResolvedValue(undefined);

      await controller.delete(id);

      expect(service.delete).toHaveBeenCalledWith(id);
    });
  });
});

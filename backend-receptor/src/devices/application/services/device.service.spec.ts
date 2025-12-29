import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceRepository } from '../../domain/repositories/device.repository';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import { createMockDevice, createMockArea } from '../../../test-helpers';
import type {
  CreateDeviceDto,
  UpdateDeviceDto,
  DeviceFilters,
} from '../../domain/repositories/device.repository';

describe('DeviceService', () => {
  let service: DeviceService;
  let deviceRepository: jest.Mocked<DeviceRepository>;
  let areaRepository: jest.Mocked<AreaRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        {
          provide: DeviceRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByExternalId: jest.fn(),
            findByAreaId: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
            countByAreaId: jest.fn(),
          },
        },
        {
          provide: AreaRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
    deviceRepository = module.get(DeviceRepository);
    areaRepository = module.get(AreaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create device successfully when valid data is provided', async () => {
      const createDto: CreateDeviceDto = {
        name: 'New Device',
        areaId: 1,
        externalId: 'DEV001',
      };
      const mockArea = createMockArea({ id: 1 });
      const mockDevice = createMockDevice(createDto);

      areaRepository.findById.mockResolvedValue(mockArea);
      deviceRepository.findByExternalId.mockResolvedValue(null);
      deviceRepository.create.mockResolvedValue(mockDevice);

      const result = await service.create(createDto);

      expect(result).toEqual(mockDevice);
      expect(areaRepository.findById).toHaveBeenCalledWith(1);
      expect(deviceRepository.findByExternalId).toHaveBeenCalledWith('DEV001');
      expect(deviceRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw NotFoundException when area does not exist', async () => {
      const createDto: CreateDeviceDto = {
        name: 'New Device',
        areaId: 999,
        externalId: 'DEV001',
      };

      areaRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Area with ID 999 not found'
      );
      expect(deviceRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when externalId already exists', async () => {
      const createDto: CreateDeviceDto = {
        name: 'New Device',
        areaId: 1,
        externalId: 'EXISTING',
      };
      const mockArea = createMockArea({ id: 1 });
      const existingDevice = createMockDevice({ externalId: 'EXISTING' });

      areaRepository.findById.mockResolvedValue(mockArea);
      deviceRepository.findByExternalId.mockResolvedValue(existingDevice);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Device with externalId 'EXISTING' already exists"
      );
      expect(deviceRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated devices when filters are provided', async () => {
      const filters: DeviceFilters = { limit: 10, offset: 0 };
      const mockDevices = [
        createMockDevice({ id: 1, name: 'Device 1' }),
        createMockDevice({ id: 2, name: 'Device 2' }),
      ];

      deviceRepository.findAll.mockResolvedValue({
        data: mockDevices,
        total: 2,
      });

      const result = await service.findAll(filters);

      expect(result.data).toEqual(mockDevices);
      expect(result.total).toBe(2);
      expect(deviceRepository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return all devices when no filters are provided', async () => {
      const mockDevices = [createMockDevice({ id: 1 })];
      deviceRepository.findAll.mockResolvedValue({
        data: mockDevices,
        total: 1,
      });

      const result = await service.findAll();

      expect(result.data).toEqual(mockDevices);
      expect(result.total).toBe(1);
      expect(deviceRepository.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findById', () => {
    it('should return device when found', async () => {
      const id = 1;
      const mockDevice = createMockDevice({ id });

      deviceRepository.findById.mockResolvedValue(mockDevice);

      const result = await service.findById(id);

      expect(result).toEqual(mockDevice);
      expect(deviceRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when device not found', async () => {
      const id = 999;

      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `Device with ID ${id} not found`
      );
    });
  });

  describe('findByExternalId', () => {
    it('should return device when found', async () => {
      const externalId = 'DEV001';
      const mockDevice = createMockDevice({ externalId });

      deviceRepository.findByExternalId.mockResolvedValue(mockDevice);

      const result = await service.findByExternalId(externalId);

      expect(result).toEqual(mockDevice);
      expect(deviceRepository.findByExternalId).toHaveBeenCalledWith(
        externalId
      );
    });

    it('should throw NotFoundException when device not found', async () => {
      const externalId = 'NONEXISTENT';

      deviceRepository.findByExternalId.mockResolvedValue(null);

      await expect(service.findByExternalId(externalId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findByExternalId(externalId)).rejects.toThrow(
        `Device with externalId '${externalId}' not found`
      );
    });
  });

  describe('findByAreaId', () => {
    it('should return devices for area when area exists', async () => {
      const areaId = 1;
      const mockArea = createMockArea({ id: areaId });
      const mockDevices = [createMockDevice({ areaId })];

      areaRepository.findById.mockResolvedValue(mockArea);
      deviceRepository.findByAreaId.mockResolvedValue(mockDevices);

      const result = await service.findByAreaId(areaId);

      expect(result).toEqual(mockDevices);
      expect(areaRepository.findById).toHaveBeenCalledWith(areaId);
      expect(deviceRepository.findByAreaId).toHaveBeenCalledWith(areaId);
    });

    it('should throw NotFoundException when area does not exist', async () => {
      const areaId = 999;

      areaRepository.findById.mockResolvedValue(null);

      await expect(service.findByAreaId(areaId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findByAreaId(areaId)).rejects.toThrow(
        `Area with ID ${areaId} not found`
      );
    });
  });

  describe('update', () => {
    it('should update device successfully when valid data is provided', async () => {
      const id = 1;
      const updateDto: UpdateDeviceDto = { name: 'Updated Device' };
      const existingDevice = createMockDevice({ id, name: 'Original Device' });
      const updatedDevice = createMockDevice({ id, name: 'Updated Device' });

      deviceRepository.findById.mockResolvedValue(existingDevice);
      deviceRepository.update.mockResolvedValue(updatedDevice);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedDevice);
      expect(deviceRepository.findById).toHaveBeenCalledWith(id);
      expect(deviceRepository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException when area does not exist in update', async () => {
      const id = 1;
      const updateDto: UpdateDeviceDto = { areaId: 999 };
      const existingDevice = createMockDevice({ id });

      deviceRepository.findById.mockResolvedValue(existingDevice);
      areaRepository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        'Area with ID 999 not found'
      );
    });

    it('should throw ConflictException when new externalId conflicts', async () => {
      const id = 1;
      const updateDto: UpdateDeviceDto = { externalId: 'EXISTING' };
      const existingDevice = createMockDevice({ id, externalId: 'ORIGINAL' });
      const conflictingDevice = createMockDevice({
        id: 2,
        externalId: 'EXISTING',
      });

      deviceRepository.findById.mockResolvedValue(existingDevice);
      deviceRepository.findByExternalId.mockResolvedValue(conflictingDevice);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        "Device with externalId 'EXISTING' already exists"
      );
    });

    it('should throw NotFoundException when device does not exist', async () => {
      const id = 999;
      const updateDto: UpdateDeviceDto = { name: 'Updated Device' };

      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should soft delete device successfully when device exists', async () => {
      const id = 1;
      const existingDevice = createMockDevice({ id });

      deviceRepository.findById.mockResolvedValue(existingDevice);
      deviceRepository.softDelete.mockResolvedValue(true);

      await service.remove(id);

      expect(deviceRepository.findById).toHaveBeenCalledWith(id);
      expect(deviceRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when device does not exist', async () => {
      const id = 999;

      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      expect(deviceRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should restore device successfully when device is deleted', async () => {
      const id = 1;
      const restoredDevice = createMockDevice({ id });

      deviceRepository.restore.mockResolvedValue(true);
      deviceRepository.findById.mockResolvedValue(restoredDevice);

      const result = await service.restore(id);

      expect(result).toEqual(restoredDevice);
      expect(deviceRepository.restore).toHaveBeenCalledWith(id);
      expect(deviceRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when device does not exist', async () => {
      const id = 999;

      deviceRepository.restore.mockResolvedValue(false);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
      await expect(service.restore(id)).rejects.toThrow(
        `Device with ID ${id} not found or not deleted`
      );
    });
  });

  describe('getCount', () => {
    it('should return count of devices', async () => {
      const expectedCount = 5;

      deviceRepository.count.mockResolvedValue(expectedCount);

      const result = await service.getCount();

      expect(result).toBe(expectedCount);
      expect(deviceRepository.count).toHaveBeenCalled();
    });
  });

  describe('getCountByAreaId', () => {
    it('should return count of devices for area when area exists', async () => {
      const areaId = 1;
      const expectedCount = 3;
      const mockArea = createMockArea({ id: areaId });

      areaRepository.findById.mockResolvedValue(mockArea);
      deviceRepository.countByAreaId.mockResolvedValue(expectedCount);

      const result = await service.getCountByAreaId(areaId);

      expect(result).toBe(expectedCount);
      expect(areaRepository.findById).toHaveBeenCalledWith(areaId);
      expect(deviceRepository.countByAreaId).toHaveBeenCalledWith(areaId);
    });

    it('should throw NotFoundException when area does not exist', async () => {
      const areaId = 999;

      areaRepository.findById.mockResolvedValue(null);

      await expect(service.getCountByAreaId(areaId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getCountByAreaId(areaId)).rejects.toThrow(
        `Area with ID ${areaId} not found`
      );
    });
  });
});

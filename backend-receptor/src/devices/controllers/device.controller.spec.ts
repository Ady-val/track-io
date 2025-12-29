import { Test, type TestingModule } from '@nestjs/testing';
import { DeviceController } from './device.controller';
import { DeviceService } from '../application/services/device.service';
import { DeviceMapper } from '../application/mappers/device.mapper';
import { createMockDevice } from '../../test-helpers';
import type {
  CreateDeviceDto,
  UpdateDeviceDto,
} from '../application/dtos/device.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

jest.mock('../application/mappers/device.mapper');

describe('DeviceController', () => {
  let controller: DeviceController;
  let service: jest.Mocked<DeviceService>;
  let mapper: jest.Mocked<typeof DeviceMapper>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [
        {
          provide: DeviceService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByExternalId: jest.fn(),
            findByAreaId: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            getCount: jest.fn(),
            getCountByAreaId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DeviceController>(DeviceController);
    service = module.get(DeviceService);
    mapper = DeviceMapper as jest.Mocked<typeof DeviceMapper>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create device and return success response', async () => {
      const createDto: CreateDeviceDto = {
        name: 'New Device',
        areaId: 1,
        externalId: 'DEV001',
      };
      const mockDevice = createMockDevice(createDto);
      const mockResponseDto = {
        id: mockDevice.id,
        name: mockDevice.name,
        areaId: mockDevice.areaId,
        areaName: 'Test Area',
        externalId: mockDevice.externalId,
        isVirtualDevice: mockDevice.isVirtualDevice,
        deviceSignals: [],
        createdAt: mockDevice.createdAt,
        updatedAt: mockDevice.updatedAt,
      };

      service.create.mockResolvedValue(mockDevice);
      mapper.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.create(createDto);

      expect(result.message).toBe('Device created successfully');
      expect(result.data.name).toBe('New Device');
      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(mapper.toResponseDto).toHaveBeenCalledWith(mockDevice);
    });

    it('should propagate NotFoundException when area does not exist', async () => {
      const createDto: CreateDeviceDto = {
        name: 'New Device',
        areaId: 999,
        externalId: 'DEV001',
      };

      service.create.mockRejectedValue(
        new NotFoundException('Area with ID 999 not found')
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should propagate ConflictException when externalId exists', async () => {
      const createDto: CreateDeviceDto = {
        name: 'New Device',
        areaId: 1,
        externalId: 'EXISTING',
      };

      service.create.mockRejectedValue(
        new ConflictException(
          "Device with externalId 'EXISTING' already exists"
        )
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated devices with default pagination', async () => {
      const mockDevices = [
        createMockDevice({ id: 1, name: 'Device 1' }),
        createMockDevice({ id: 2, name: 'Device 2' }),
      ];
      const mockResponseDtos = [
        {
          id: 1,
          name: 'Device 1',
          areaId: 1,
          areaName: 'Test Area',
          externalId: 'DEV001',
          isVirtualDevice: false,
          deviceSignals: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Device 2',
          areaId: 1,
          areaName: 'Test Area',
          externalId: 'DEV002',
          isVirtualDevice: false,
          deviceSignals: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      service.findAll.mockResolvedValue({
        data: mockDevices,
        total: 2,
      });
      mapper.toResponseDtoArray.mockReturnValue(mockResponseDtos);

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        10,
        0,
        false
      );

      expect(result.message).toBe('Devices retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
    });

    it('should apply filters when provided', async () => {
      const mockDevices = [createMockDevice({ id: 1 })];
      const mockResponseDtos = [
        {
          id: 1,
          name: 'Filtered Device',
          areaId: 1,
          areaName: 'Test Area',
          externalId: 'DEV001',
          isVirtualDevice: false,
          deviceSignals: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      service.findAll.mockResolvedValue({
        data: mockDevices,
        total: 1,
      });
      mapper.toResponseDtoArray.mockReturnValue(mockResponseDtos);

      await controller.findAll('Filtered', 1, 'DEV001', 10, 0, false);

      expect(service.findAll).toHaveBeenCalledWith({
        name: 'Filtered',
        areaId: 1,
        externalId: 'DEV001',
        limit: 10,
      });
    });
  });

  describe('getCount', () => {
    it('should return count of devices', async () => {
      const expectedCount = 5;

      service.getCount.mockResolvedValue(expectedCount);

      const result = await controller.getCount();

      expect(result.message).toBe('Devices count retrieved successfully');
      expect(result.count).toBe(expectedCount);
      expect(service.getCount).toHaveBeenCalled();
    });
  });

  describe('getCountByAreaId', () => {
    it('should return count of devices for area', async () => {
      const areaId = 1;
      const expectedCount = 3;

      service.getCountByAreaId.mockResolvedValue(expectedCount);

      const result = await controller.getCountByAreaId(areaId);

      expect(result.message).toBe(
        'Devices count by area retrieved successfully'
      );
      expect(result.count).toBe(expectedCount);
      expect(service.getCountByAreaId).toHaveBeenCalledWith(areaId);
    });
  });

  describe('findByAreaId', () => {
    it('should return devices for area', async () => {
      const areaId = 1;
      const mockDevices = [createMockDevice({ areaId })];
      const mockResponseDtos = [
        {
          id: 1,
          name: 'Test Device',
          areaId: 1,
          areaName: 'Test Area',
          externalId: 'DEV001',
          isVirtualDevice: false,
          deviceSignals: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      service.findByAreaId.mockResolvedValue(mockDevices);
      mapper.toResponseDtoArray.mockReturnValue(mockResponseDtos);

      const result = await controller.findByAreaId(areaId);

      expect(result.message).toBe('Devices by area retrieved successfully');
      expect(result.data).toHaveLength(1);
      expect(service.findByAreaId).toHaveBeenCalledWith(areaId);
    });
  });

  describe('findByExternalId', () => {
    it('should return device by external id', async () => {
      const externalId = 'DEV001';
      const mockDevice = createMockDevice({ externalId });
      const mockResponseDto = {
        id: 1,
        name: 'Test Device',
        areaId: 1,
        areaName: 'Test Area',
        externalId: 'DEV001',
        isVirtualDevice: false,
        deviceSignals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.findByExternalId.mockResolvedValue(mockDevice);
      mapper.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.findByExternalId(externalId);

      expect(result.message).toBe('Device retrieved successfully');
      expect(result.data.externalId).toBe(externalId);
      expect(service.findByExternalId).toHaveBeenCalledWith(externalId);
    });
  });

  describe('findOne', () => {
    it('should return device by id', async () => {
      const id = 1;
      const mockDevice = createMockDevice({ id });
      const mockResponseDto = {
        id: 1,
        name: 'Test Device',
        areaId: 1,
        areaName: 'Test Area',
        externalId: 'DEV001',
        isVirtualDevice: false,
        deviceSignals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.findById.mockResolvedValue(mockDevice);
      mapper.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.findOne(id);

      expect(result.message).toBe('Device retrieved successfully');
      expect(result.data.id).toBe(id);
      expect(service.findById).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when device not found', async () => {
      const id = 999;

      service.findById.mockRejectedValue(
        new NotFoundException(`Device with ID ${id} not found`)
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update device and return success response', async () => {
      const id = 1;
      const updateDto: UpdateDeviceDto = { name: 'Updated Device' };
      const updatedDevice = createMockDevice({ id, name: 'Updated Device' });
      const mockResponseDto = {
        id: 1,
        name: 'Updated Device',
        areaId: 1,
        areaName: 'Test Area',
        externalId: 'DEV001',
        isVirtualDevice: false,
        deviceSignals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.update.mockResolvedValue(updatedDevice);
      mapper.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.update(id, updateDto);

      expect(result.message).toBe('Device updated successfully');
      expect(result.data.name).toBe('Updated Device');
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete device and return success message', async () => {
      const id = 1;

      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result.message).toBe('Device deleted successfully');
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('restore', () => {
    it('should restore device and return success response', async () => {
      const id = 1;
      const restoredDevice = createMockDevice({ id });
      const mockResponseDto = {
        id: 1,
        name: 'Test Device',
        areaId: 1,
        areaName: 'Test Area',
        externalId: 'DEV001',
        isVirtualDevice: false,
        deviceSignals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.restore.mockResolvedValue(restoredDevice);
      mapper.toResponseDto.mockReturnValue(mockResponseDto);

      const result = await controller.restore(id);

      expect(result.message).toBe('Device restored successfully');
      expect(result.data.id).toBe(id);
      expect(service.restore).toHaveBeenCalledWith(id);
    });
  });
});

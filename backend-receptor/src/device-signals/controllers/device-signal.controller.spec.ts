import { Test, type TestingModule } from '@nestjs/testing';
import { DeviceSignalController } from './device-signal.controller';
import { DeviceSignalService } from '../application/services/device-signal.service';
import { createMockDeviceSignal } from '../../test-helpers';
import type {
  CreateDeviceSignalDto,
  UpdateDeviceSignalDto,
} from '../application/dtos/device-signal.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('DeviceSignalController', () => {
  let controller: DeviceSignalController;
  let service: jest.Mocked<DeviceSignalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceSignalController],
      providers: [
        {
          provide: DeviceSignalService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByExternalValueId: jest.fn(),
            findByDeviceId: jest.fn(),
            findByDepartmentId: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            getCount: jest.fn(),
            getCountByDeviceId: jest.fn(),
            getCountByDepartmentId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DeviceSignalController>(DeviceSignalController);
    service = module.get(DeviceSignalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create device signal and return success response', async () => {
      const createDto: CreateDeviceSignalDto = {
        name: 'New Signal',
        deviceId: 1,
        departmentId: 1,
        externalValueId: 'VAL001',
      };
      const mockSignal = createMockDeviceSignal(createDto);

      service.create.mockResolvedValue(mockSignal);

      const result = await controller.create(createDto);

      expect(result.message).toBe('Device signal created successfully');
      expect(result.data.name).toBe('New Signal');
      expect(service.create).toHaveBeenCalledWith(createDto);
    });

    it('should propagate NotFoundException when device does not exist', async () => {
      const createDto: CreateDeviceSignalDto = {
        name: 'New Signal',
        deviceId: 999,
        departmentId: 1,
        externalValueId: 'VAL001',
      };

      service.create.mockRejectedValue(
        new NotFoundException('Device with ID 999 not found')
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should propagate ConflictException when externalValueId exists', async () => {
      const createDto: CreateDeviceSignalDto = {
        name: 'New Signal',
        deviceId: 1,
        departmentId: 1,
        externalValueId: 'EXISTING',
      };

      service.create.mockRejectedValue(
        new ConflictException(
          "Device signal with externalValueId 'EXISTING' already exists for this device"
        )
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated device signals with default pagination', async () => {
      const mockSignals = [
        createMockDeviceSignal({ id: 1, name: 'Signal 1' }),
        createMockDeviceSignal({ id: 2, name: 'Signal 2' }),
      ];

      service.findAll.mockResolvedValue({
        data: mockSignals,
        total: 2,
      });

      const result = await controller.findAll(
        undefined,
        undefined,
        undefined,
        undefined,
        10,
        0,
        false
      );

      expect(result.message).toBe('Device signals retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
    });

    it('should apply filters when provided', async () => {
      const mockSignals = [createMockDeviceSignal({ id: 1 })];

      service.findAll.mockResolvedValue({
        data: mockSignals,
        total: 1,
      });

      await controller.findAll('Filtered', 1, 1, 'VAL001', 10, 0, false);

      expect(service.findAll).toHaveBeenCalledWith({
        name: 'Filtered',
        deviceId: 1,
        departmentId: 1,
        externalValueId: 'VAL001',
        limit: 10,
      });
    });
  });

  describe('getCount', () => {
    it('should return count of device signals', async () => {
      const expectedCount = 5;

      service.getCount.mockResolvedValue(expectedCount);

      const result = await controller.getCount();

      expect(result.message).toBe(
        'Device signals count retrieved successfully'
      );
      expect(result.count).toBe(expectedCount);
      expect(service.getCount).toHaveBeenCalled();
    });
  });

  describe('getCountByDeviceId', () => {
    it('should return count of device signals for device', async () => {
      const deviceId = 1;
      const expectedCount = 3;

      service.getCountByDeviceId.mockResolvedValue(expectedCount);

      const result = await controller.getCountByDeviceId(deviceId);

      expect(result.message).toBe(
        'Device signals count by device retrieved successfully'
      );
      expect(result.count).toBe(expectedCount);
      expect(service.getCountByDeviceId).toHaveBeenCalledWith(deviceId);
    });
  });

  describe('getCountByDepartmentId', () => {
    it('should return count of device signals for department', async () => {
      const departmentId = 1;
      const expectedCount = 3;

      service.getCountByDepartmentId.mockResolvedValue(expectedCount);

      const result = await controller.getCountByDepartmentId(departmentId);

      expect(result.message).toBe(
        'Device signals count by department retrieved successfully'
      );
      expect(result.count).toBe(expectedCount);
      expect(service.getCountByDepartmentId).toHaveBeenCalledWith(departmentId);
    });
  });

  describe('findByDeviceId', () => {
    it('should return device signals for device', async () => {
      const deviceId = 1;
      const mockSignals = [createMockDeviceSignal({ deviceId })];

      service.findByDeviceId.mockResolvedValue(mockSignals);

      const result = await controller.findByDeviceId(deviceId);

      expect(result.message).toBe(
        'Device signals by device retrieved successfully'
      );
      expect(result.data).toHaveLength(1);
      expect(service.findByDeviceId).toHaveBeenCalledWith(deviceId);
    });
  });

  describe('findByDepartmentId', () => {
    it('should return device signals for department', async () => {
      const departmentId = 1;
      const mockSignals = [createMockDeviceSignal({ departmentId })];

      service.findByDepartmentId.mockResolvedValue(mockSignals);

      const result = await controller.findByDepartmentId(departmentId);

      expect(result.message).toBe(
        'Device signals by department retrieved successfully'
      );
      expect(result.data).toHaveLength(1);
      expect(service.findByDepartmentId).toHaveBeenCalledWith(departmentId);
    });
  });

  describe('findByExternalValueId', () => {
    it('should return device signal by external value id', async () => {
      const externalValueId = 'VAL001';
      const mockSignal = createMockDeviceSignal({ externalValueId });

      service.findByExternalValueId.mockResolvedValue(mockSignal);

      const result = await controller.findByExternalValueId(externalValueId);

      expect(result.message).toBe('Device signal retrieved successfully');
      expect(result.data.externalValueId).toBe(externalValueId);
      expect(service.findByExternalValueId).toHaveBeenCalledWith(
        externalValueId
      );
    });
  });

  describe('findOne', () => {
    it('should return device signal by id', async () => {
      const id = 1;
      const mockSignal = createMockDeviceSignal({ id });

      service.findById.mockResolvedValue(mockSignal);

      const result = await controller.findOne(id);

      expect(result.message).toBe('Device signal retrieved successfully');
      expect(result.data.id).toBe(id);
      expect(service.findById).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when device signal not found', async () => {
      const id = 999;

      service.findById.mockRejectedValue(
        new NotFoundException(`Device signal with ID ${id} not found`)
      );

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update device signal and return success response', async () => {
      const id = 1;
      const updateDto: UpdateDeviceSignalDto = { name: 'Updated Signal' };
      const updatedSignal = createMockDeviceSignal({
        id,
        name: 'Updated Signal',
      });

      service.update.mockResolvedValue(updatedSignal);

      const result = await controller.update(id, updateDto);

      expect(result.message).toBe('Device signal updated successfully');
      expect(result.data.name).toBe('Updated Signal');
      expect(service.update).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete device signal and return success message', async () => {
      const id = 1;

      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(result.message).toBe('Device signal deleted successfully');
      expect(service.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('restore', () => {
    it('should restore device signal and return success response', async () => {
      const id = 1;
      const restoredSignal = createMockDeviceSignal({ id });

      service.restore.mockResolvedValue(restoredSignal);

      const result = await controller.restore(id);

      expect(result.message).toBe('Device signal restored successfully');
      expect(result.data.id).toBe(id);
      expect(service.restore).toHaveBeenCalledWith(id);
    });
  });
});

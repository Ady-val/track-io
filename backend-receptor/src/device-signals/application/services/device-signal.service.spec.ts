import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DeviceSignalService } from './device-signal.service';
import { DeviceSignalRepository } from '../../domain/repositories/device-signal.repository';
import { DeviceRepository } from '../../../devices/domain/repositories/device.repository';
import { DepartmentRepository } from '../../../departments/domain/repositories/department.repository';
import {
  createMockDeviceSignal,
  createMockDevice,
  createMockDepartment,
} from '../../../test-helpers';
import type {
  CreateDeviceSignalDto,
  UpdateDeviceSignalDto,
  DeviceSignalFilters,
} from '../../domain/repositories/device-signal.repository';

describe('DeviceSignalService', () => {
  let service: DeviceSignalService;
  let deviceSignalRepository: jest.Mocked<DeviceSignalRepository>;
  let deviceRepository: jest.Mocked<DeviceRepository>;
  let departmentRepository: jest.Mocked<DepartmentRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceSignalService,
        {
          provide: DeviceSignalRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByExternalValueId: jest.fn(),
            findByExternalValueIdAndDeviceId: jest.fn(),
            findByDeviceId: jest.fn(),
            findByDepartmentId: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
            countByDeviceId: jest.fn(),
            countByDepartmentId: jest.fn(),
          },
        },
        {
          provide: DeviceRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: DepartmentRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DeviceSignalService>(DeviceSignalService);
    deviceSignalRepository = module.get(DeviceSignalRepository);
    deviceRepository = module.get(DeviceRepository);
    departmentRepository = module.get(DepartmentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create device signal successfully when valid data is provided', async () => {
      const createDto: CreateDeviceSignalDto = {
        name: 'New Signal',
        deviceId: 1,
        departmentId: 1,
        externalValueId: 'VAL001',
      };
      const mockDevice = createMockDevice({ id: 1 });
      const mockDepartment = createMockDepartment({ id: 1 });
      const mockDeviceSignal = createMockDeviceSignal(createDto);

      deviceRepository.findById.mockResolvedValue(mockDevice);
      departmentRepository.findById.mockResolvedValue(mockDepartment);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        null
      );
      deviceSignalRepository.create.mockResolvedValue(mockDeviceSignal);

      const result = await service.create(createDto);

      expect(result).toEqual(mockDeviceSignal);
      expect(deviceRepository.findById).toHaveBeenCalledWith(1);
      expect(departmentRepository.findById).toHaveBeenCalledWith(1);
      expect(
        deviceSignalRepository.findByExternalValueIdAndDeviceId
      ).toHaveBeenCalledWith('VAL001', 1);
      expect(deviceSignalRepository.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw NotFoundException when device does not exist', async () => {
      const createDto: CreateDeviceSignalDto = {
        name: 'New Signal',
        deviceId: 999,
        departmentId: 1,
        externalValueId: 'VAL001',
      };

      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Device with ID 999 not found'
      );
      expect(deviceSignalRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when department does not exist', async () => {
      const createDto: CreateDeviceSignalDto = {
        name: 'New Signal',
        deviceId: 1,
        departmentId: 999,
        externalValueId: 'VAL001',
      };
      const mockDevice = createMockDevice({ id: 1 });

      deviceRepository.findById.mockResolvedValue(mockDevice);
      departmentRepository.findById.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Department with ID 999 not found'
      );
      expect(deviceSignalRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when externalValueId already exists for device', async () => {
      const createDto: CreateDeviceSignalDto = {
        name: 'New Signal',
        deviceId: 1,
        departmentId: 1,
        externalValueId: 'EXISTING',
      };
      const mockDevice = createMockDevice({ id: 1 });
      const mockDepartment = createMockDepartment({ id: 1 });
      const existingSignal = createMockDeviceSignal({
        externalValueId: 'EXISTING',
        deviceId: 1,
      });

      deviceRepository.findById.mockResolvedValue(mockDevice);
      departmentRepository.findById.mockResolvedValue(mockDepartment);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        existingSignal
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createDto)).rejects.toThrow(
        "Device signal with externalValueId 'EXISTING' already exists for this device"
      );
      expect(deviceSignalRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated device signals when filters are provided', async () => {
      const filters: DeviceSignalFilters = { limit: 10, offset: 0 };
      const mockSignals = [
        createMockDeviceSignal({ id: 1, name: 'Signal 1' }),
        createMockDeviceSignal({ id: 2, name: 'Signal 2' }),
      ];

      deviceSignalRepository.findAll.mockResolvedValue({
        data: mockSignals,
        total: 2,
      });

      const result = await service.findAll(filters);

      expect(result.data).toEqual(mockSignals);
      expect(result.total).toBe(2);
      expect(deviceSignalRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findById', () => {
    it('should return device signal when found', async () => {
      const id = 1;
      const mockSignal = createMockDeviceSignal({ id });

      deviceSignalRepository.findById.mockResolvedValue(mockSignal);

      const result = await service.findById(id);

      expect(result).toEqual(mockSignal);
      expect(deviceSignalRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when device signal not found', async () => {
      const id = 999;

      deviceSignalRepository.findById.mockResolvedValue(null);

      await expect(service.findById(id)).rejects.toThrow(NotFoundException);
      await expect(service.findById(id)).rejects.toThrow(
        `Device signal with ID ${id} not found`
      );
    });
  });

  describe('findByExternalValueId', () => {
    it('should return device signal when found', async () => {
      const externalValueId = 'VAL001';
      const mockSignal = createMockDeviceSignal({ externalValueId });

      deviceSignalRepository.findByExternalValueId.mockResolvedValue(
        mockSignal
      );

      const result = await service.findByExternalValueId(externalValueId);

      expect(result).toEqual(mockSignal);
      expect(deviceSignalRepository.findByExternalValueId).toHaveBeenCalledWith(
        externalValueId
      );
    });

    it('should throw NotFoundException when device signal not found', async () => {
      const externalValueId = 'NONEXISTENT';

      deviceSignalRepository.findByExternalValueId.mockResolvedValue(null);

      await expect(
        service.findByExternalValueId(externalValueId)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findByExternalValueId(externalValueId)
      ).rejects.toThrow(
        `Device signal with externalValueId '${externalValueId}' not found`
      );
    });
  });

  describe('findByDeviceId', () => {
    it('should return device signals for device when device exists', async () => {
      const deviceId = 1;
      const mockDevice = createMockDevice({ id: deviceId });
      const mockSignals = [createMockDeviceSignal({ deviceId })];

      deviceRepository.findById.mockResolvedValue(mockDevice);
      deviceSignalRepository.findByDeviceId.mockResolvedValue(mockSignals);

      const result = await service.findByDeviceId(deviceId);

      expect(result).toEqual(mockSignals);
      expect(deviceRepository.findById).toHaveBeenCalledWith(deviceId);
      expect(deviceSignalRepository.findByDeviceId).toHaveBeenCalledWith(
        deviceId
      );
    });

    it('should throw NotFoundException when device does not exist', async () => {
      const deviceId = 999;

      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.findByDeviceId(deviceId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findByDeviceId(deviceId)).rejects.toThrow(
        `Device with ID ${deviceId} not found`
      );
    });
  });

  describe('findByDepartmentId', () => {
    it('should return device signals for department when department exists', async () => {
      const departmentId = 1;
      const mockDepartment = createMockDepartment({ id: departmentId });
      const mockSignals = [createMockDeviceSignal({ departmentId })];

      departmentRepository.findById.mockResolvedValue(mockDepartment);
      deviceSignalRepository.findByDepartmentId.mockResolvedValue(mockSignals);

      const result = await service.findByDepartmentId(departmentId);

      expect(result).toEqual(mockSignals);
      expect(departmentRepository.findById).toHaveBeenCalledWith(departmentId);
      expect(deviceSignalRepository.findByDepartmentId).toHaveBeenCalledWith(
        departmentId
      );
    });

    it('should throw NotFoundException when department does not exist', async () => {
      const departmentId = 999;

      departmentRepository.findById.mockResolvedValue(null);

      await expect(service.findByDepartmentId(departmentId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findByDepartmentId(departmentId)).rejects.toThrow(
        `Department with ID ${departmentId} not found`
      );
    });
  });

  describe('update', () => {
    it('should update device signal successfully when valid data is provided', async () => {
      const id = 1;
      const updateDto: UpdateDeviceSignalDto = { name: 'Updated Signal' };
      const existingSignal = createMockDeviceSignal({
        id,
        name: 'Original Signal',
      });
      const updatedSignal = createMockDeviceSignal({
        id,
        name: 'Updated Signal',
      });

      deviceSignalRepository.findById.mockResolvedValue(existingSignal);
      deviceSignalRepository.update.mockResolvedValue(updatedSignal);

      const result = await service.update(id, updateDto);

      expect(result).toEqual(updatedSignal);
      expect(deviceSignalRepository.findById).toHaveBeenCalledWith(id);
      expect(deviceSignalRepository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException when device does not exist in update', async () => {
      const id = 1;
      const updateDto: UpdateDeviceSignalDto = { deviceId: 999 };
      const existingSignal = createMockDeviceSignal({ id });

      deviceSignalRepository.findById.mockResolvedValue(existingSignal);
      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        'Device with ID 999 not found'
      );
    });

    it('should throw NotFoundException when department does not exist in update', async () => {
      const id = 1;
      const updateDto: UpdateDeviceSignalDto = { departmentId: 999 };
      const existingSignal = createMockDeviceSignal({ id });

      deviceSignalRepository.findById.mockResolvedValue(existingSignal);
      departmentRepository.findById.mockResolvedValue(null);

      await expect(service.update(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        'Department with ID 999 not found'
      );
    });

    it('should throw ConflictException when new externalValueId conflicts', async () => {
      const id = 1;
      const updateDto: UpdateDeviceSignalDto = { externalValueId: 'EXISTING' };
      const existingSignal = createMockDeviceSignal({
        id,
        deviceId: 1,
        externalValueId: 'ORIGINAL',
      });
      const conflictingSignal = createMockDeviceSignal({
        id: 2,
        deviceId: 1,
        externalValueId: 'EXISTING',
      });

      deviceSignalRepository.findById.mockResolvedValue(existingSignal);
      deviceSignalRepository.findByExternalValueIdAndDeviceId.mockResolvedValue(
        conflictingSignal
      );

      await expect(service.update(id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(id, updateDto)).rejects.toThrow(
        "Device signal with externalValueId 'EXISTING' already exists for this device"
      );
    });
  });

  describe('remove', () => {
    it('should soft delete device signal successfully when signal exists', async () => {
      const id = 1;
      const existingSignal = createMockDeviceSignal({ id });

      deviceSignalRepository.findById.mockResolvedValue(existingSignal);
      deviceSignalRepository.softDelete.mockResolvedValue(true);

      await service.remove(id);

      expect(deviceSignalRepository.findById).toHaveBeenCalledWith(id);
      expect(deviceSignalRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when device signal does not exist', async () => {
      const id = 999;

      deviceSignalRepository.findById.mockResolvedValue(null);

      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      expect(deviceSignalRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should restore device signal successfully when signal is deleted', async () => {
      const id = 1;
      const restoredSignal = createMockDeviceSignal({ id });

      deviceSignalRepository.restore.mockResolvedValue(true);
      deviceSignalRepository.findById.mockResolvedValue(restoredSignal);

      const result = await service.restore(id);

      expect(result).toEqual(restoredSignal);
      expect(deviceSignalRepository.restore).toHaveBeenCalledWith(id);
      expect(deviceSignalRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when device signal does not exist', async () => {
      const id = 999;

      deviceSignalRepository.restore.mockResolvedValue(false);

      await expect(service.restore(id)).rejects.toThrow(NotFoundException);
      await expect(service.restore(id)).rejects.toThrow(
        `Device signal with ID ${id} not found or not deleted`
      );
    });
  });

  describe('getCount', () => {
    it('should return count of device signals', async () => {
      const expectedCount = 5;

      deviceSignalRepository.count.mockResolvedValue(expectedCount);

      const result = await service.getCount();

      expect(result).toBe(expectedCount);
      expect(deviceSignalRepository.count).toHaveBeenCalled();
    });
  });

  describe('getCountByDeviceId', () => {
    it('should return count of device signals for device when device exists', async () => {
      const deviceId = 1;
      const expectedCount = 3;
      const mockDevice = createMockDevice({ id: deviceId });

      deviceRepository.findById.mockResolvedValue(mockDevice);
      deviceSignalRepository.countByDeviceId.mockResolvedValue(expectedCount);

      const result = await service.getCountByDeviceId(deviceId);

      expect(result).toBe(expectedCount);
      expect(deviceRepository.findById).toHaveBeenCalledWith(deviceId);
      expect(deviceSignalRepository.countByDeviceId).toHaveBeenCalledWith(
        deviceId
      );
    });

    it('should throw NotFoundException when device does not exist', async () => {
      const deviceId = 999;

      deviceRepository.findById.mockResolvedValue(null);

      await expect(service.getCountByDeviceId(deviceId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getCountByDepartmentId', () => {
    it('should return count of device signals for department when department exists', async () => {
      const departmentId = 1;
      const expectedCount = 3;
      const mockDepartment = createMockDepartment({ id: departmentId });

      departmentRepository.findById.mockResolvedValue(mockDepartment);
      deviceSignalRepository.countByDepartmentId.mockResolvedValue(
        expectedCount
      );

      const result = await service.getCountByDepartmentId(departmentId);

      expect(result).toBe(expectedCount);
      expect(departmentRepository.findById).toHaveBeenCalledWith(departmentId);
      expect(deviceSignalRepository.countByDepartmentId).toHaveBeenCalledWith(
        departmentId
      );
    });

    it('should throw NotFoundException when department does not exist', async () => {
      const departmentId = 999;

      departmentRepository.findById.mockResolvedValue(null);

      await expect(
        service.getCountByDepartmentId(departmentId)
      ).rejects.toThrow(NotFoundException);
    });
  });
});

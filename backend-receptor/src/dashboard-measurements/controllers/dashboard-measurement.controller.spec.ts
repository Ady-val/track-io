import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DashboardMeasurementController } from './dashboard-measurement.controller';
import { DashboardMeasurementService } from '../application/services/dashboard-measurement.service';
import {
  createMockDashboardMeasurement,
  createMockMeasurement,
} from '../../test-helpers';

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

const mockPermissionGuard = {
  canActivate: jest.fn(() => true),
};

describe('DashboardMeasurementController', () => {
  let controller: DashboardMeasurementController;
  let service: jest.Mocked<DashboardMeasurementService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardMeasurementController],
      providers: [
        {
          provide: DashboardMeasurementService,
          useValue: {
            getAllDashboardMeasurements: jest.fn(),
            getAvailableDashboardMeasurements: jest.fn(),
            getDashboardMeasurementById: jest.fn(),
            getDashboardMeasurementByMeasurementId: jest.fn(),
            createDashboardMeasurement: jest.fn(),
            updateDashboardMeasurement: jest.fn(),
            deleteDashboardMeasurement: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(
        mockJwtAuthGuard.constructor as unknown as new () => unknown
      )
      .useValue(mockJwtAuthGuard)
      .overrideGuard(
        mockPermissionGuard.constructor as unknown as new () => unknown
      )
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<DashboardMeasurementController>(
      DashboardMeasurementController
    );
    service = module.get(DashboardMeasurementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDashboardMeasurements', () => {
    it('should return list of dashboard measurements', async () => {
      const mockMeasurements = [
        createMockDashboardMeasurement({ id: 1 }),
        createMockDashboardMeasurement({ id: 2 }),
      ];
      service.getAllDashboardMeasurements.mockResolvedValue(mockMeasurements);

      const result = await controller.getAllDashboardMeasurements();

      expect(result.message).toBe(
        'Dashboard measurements retrieved successfully'
      );
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(service.getAllDashboardMeasurements).toHaveBeenCalledWith(
        undefined
      );
    });

    it('should apply groupId filter when provided', async () => {
      const groupId = '1';
      const mockMeasurements = [
        createMockDashboardMeasurement({ id: 1, groupId: 1 }),
      ];
      service.getAllDashboardMeasurements.mockResolvedValue(mockMeasurements);

      const result = await controller.getAllDashboardMeasurements(groupId);

      expect(result.data).toHaveLength(1);
      expect(service.getAllDashboardMeasurements).toHaveBeenCalledWith(1);
    });
  });

  describe('getDashboardMeasurementById', () => {
    it('should return dashboard measurement when exists', async () => {
      const id = 1;
      const mockMeasurement = createMockDashboardMeasurement({ id });
      service.getDashboardMeasurementById.mockResolvedValue(mockMeasurement);

      const result = await controller.getDashboardMeasurementById(id);

      expect(result.message).toBe(
        'Dashboard measurement retrieved successfully'
      );
      expect(result.data).toEqual(mockMeasurement);
      expect(service.getDashboardMeasurementById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when dashboard measurement does not exist', async () => {
      const id = 999;
      service.getDashboardMeasurementById.mockRejectedValue(
        new NotFoundException(`Dashboard measurement with ID ${id} not found`)
      );

      await expect(controller.getDashboardMeasurementById(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getAvailableDashboardMeasurements', () => {
    it('should return list of available dashboard measurements', async () => {
      const mockMeasurements = [
        createMockDashboardMeasurement({
          id: 1,
          groupId: null,
          measurement: createMockMeasurement({ id: 1 }),
        }),
        createMockDashboardMeasurement({
          id: 2,
          groupId: null,
          measurement: createMockMeasurement({ id: 2 }),
        }),
      ];
      service.getAvailableDashboardMeasurements.mockResolvedValue(
        mockMeasurements
      );

      const result = await controller.getAvailableDashboardMeasurements();

      expect(result.message).toBe(
        'Available dashboard measurements retrieved successfully'
      );
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(service.getAvailableDashboardMeasurements).toHaveBeenCalled();
    });

    it('should return empty array when no available measurements', async () => {
      service.getAvailableDashboardMeasurements.mockResolvedValue([]);

      const result = await controller.getAvailableDashboardMeasurements();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getDashboardMeasurementByMeasurementId', () => {
    it('should return dashboard measurement when exists', async () => {
      const measurementId = 1;
      const mockMeasurement = createMockDashboardMeasurement({
        measurementId,
      });
      service.getDashboardMeasurementByMeasurementId.mockResolvedValue(
        mockMeasurement
      );

      const result =
        await controller.getDashboardMeasurementByMeasurementId(measurementId);

      expect(result.message).toBe(
        'Dashboard measurement retrieved successfully'
      );
      expect(result.data).toEqual(mockMeasurement);
      expect(
        service.getDashboardMeasurementByMeasurementId
      ).toHaveBeenCalledWith(measurementId);
    });

    it('should return null when dashboard measurement does not exist', async () => {
      const measurementId = 999;
      service.getDashboardMeasurementByMeasurementId.mockResolvedValue(null);

      const result =
        await controller.getDashboardMeasurementByMeasurementId(measurementId);

      expect(result.data).toBeNull();
    });
  });

  describe('createDashboardMeasurement', () => {
    it('should create dashboard measurement successfully', async () => {
      const createDto = {
        measurementId: 1,
        minValue: 0,
        maxValue: 100,
      };
      const mockMeasurement = createMockDashboardMeasurement({
        id: 1,
        ...createDto,
      });
      service.createDashboardMeasurement.mockResolvedValue(mockMeasurement);

      const result = await controller.createDashboardMeasurement(createDto);

      expect(result.message).toBe('Dashboard measurement created successfully');
      expect(result.data).toEqual(mockMeasurement);
      expect(service.createDashboardMeasurement).toHaveBeenCalledWith(
        createDto
      );
    });

    it('should throw BadRequestException when minValue >= maxValue', async () => {
      const invalidDto = {
        measurementId: 1,
        minValue: 100,
        maxValue: 50,
      };
      service.createDashboardMeasurement.mockRejectedValue(
        new BadRequestException('minValue must be less than maxValue')
      );

      await expect(
        controller.createDashboardMeasurement(invalidDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateDashboardMeasurement', () => {
    it('should update dashboard measurement successfully', async () => {
      const id = 1;
      const updateDto = {
        minValue: 10,
        maxValue: 90,
      };
      const mockMeasurement = createMockDashboardMeasurement({
        id,
        ...updateDto,
      });
      service.updateDashboardMeasurement.mockResolvedValue(mockMeasurement);

      const result = await controller.updateDashboardMeasurement(id, updateDto);

      expect(result.message).toBe('Dashboard measurement updated successfully');
      expect(result.data).toEqual(mockMeasurement);
      expect(service.updateDashboardMeasurement).toHaveBeenCalledWith(
        id,
        updateDto
      );
    });

    it('should throw NotFoundException when dashboard measurement does not exist', async () => {
      const id = 999;
      const updateDto = {
        minValue: 10,
        maxValue: 90,
      };
      service.updateDashboardMeasurement.mockRejectedValue(
        new NotFoundException(`Dashboard measurement with ID ${id} not found`)
      );

      await expect(
        controller.updateDashboardMeasurement(id, updateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDashboardMeasurement', () => {
    it('should delete dashboard measurement successfully', async () => {
      const id = 1;
      service.deleteDashboardMeasurement.mockResolvedValue(undefined);

      await controller.deleteDashboardMeasurement(id);

      expect(service.deleteDashboardMeasurement).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when dashboard measurement does not exist', async () => {
      const id = 999;
      service.deleteDashboardMeasurement.mockRejectedValue(
        new NotFoundException(`Dashboard measurement with ID ${id} not found`)
      );

      await expect(controller.deleteDashboardMeasurement(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});

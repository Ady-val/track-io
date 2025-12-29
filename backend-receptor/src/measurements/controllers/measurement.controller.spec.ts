import { Test, type TestingModule } from '@nestjs/testing';
import { MeasurementController } from './measurement.controller';
import { MeasurementService } from '../application/services/measurement.service';
import {
  createMockMeasurement,
  createMockMeasurementValue,
} from '../../test-helpers';
import type {
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from '../application/dtos/measurement.dto';
import { MeasurementType } from '../domain/entities/measurement.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('MeasurementController', () => {
  let controller: MeasurementController;
  let service: jest.Mocked<MeasurementService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeasurementController],
      providers: [
        {
          provide: MeasurementService,
          useValue: {
            createMeasurement: jest.fn(),
            getAllMeasurements: jest.fn(),
            getMeasurementById: jest.fn(),
            getMeasurementByExternalId: jest.fn(),
            updateMeasurement: jest.fn(),
            deleteMeasurement: jest.fn(),
            restoreMeasurement: jest.fn(),
            getMeasurementsCount: jest.fn(),
            getMeasurementValues: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MeasurementController>(MeasurementController);
    service = module.get(MeasurementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMeasurement', () => {
    it('should create measurement and return success response', async () => {
      const createDto: CreateMeasurementDto = {
        externalId: 'MEAS001',
        name: 'Temperature Sensor',
        type: MeasurementType.TEMPERATURE,
      };
      const mockMeasurement = createMockMeasurement(createDto);

      service.createMeasurement.mockResolvedValue(mockMeasurement);

      const result = await controller.createMeasurement(createDto);

      expect(result.message).toBe('Measurement created successfully');
      expect(result.data.name).toBe('Temperature Sensor');
      expect(result.data.type).toBe(MeasurementType.TEMPERATURE);
      expect(service.createMeasurement).toHaveBeenCalledWith(createDto);
    });
  });

  describe('getAllMeasurements', () => {
    it('should return paginated measurements with default pagination', async () => {
      const mockMeasurements = [
        createMockMeasurement({
          id: 1,
          name: 'Measurement 1',
          type: MeasurementType.TEMPERATURE,
        }),
        createMockMeasurement({
          id: 2,
          name: 'Measurement 2',
          type: MeasurementType.HUMIDITY,
        }),
      ];

      service.getAllMeasurements.mockResolvedValue({
        data: mockMeasurements,
        total: 2,
      });

      const result = await controller.getAllMeasurements(
        undefined,
        undefined,
        10,
        0
      );

      expect(result.message).toBe('Measurements retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);
    });

    it('should apply filters when provided', async () => {
      const mockMeasurements = [createMockMeasurement({ id: 1 })];

      service.getAllMeasurements.mockResolvedValue({
        data: mockMeasurements,
        total: 1,
      });

      await controller.getAllMeasurements('MEAS001', 'temperature', 10, 0);

      expect(service.getAllMeasurements).toHaveBeenCalledWith({
        externalId: 'MEAS001',
        type: 'temperature',
        limit: 10,
      });
    });
  });

  describe('getMeasurementsCount', () => {
    it('should return count of measurements', async () => {
      const expectedCount = 5;

      service.getMeasurementsCount.mockResolvedValue(expectedCount);

      const result = await controller.getMeasurementsCount();

      expect(result.message).toBe('Measurements count retrieved successfully');
      expect(result.count).toBe(expectedCount);
      expect(service.getMeasurementsCount).toHaveBeenCalled();
    });
  });

  describe('getMeasurementById', () => {
    it('should return measurement by id', async () => {
      const id = 1;
      const mockMeasurement = createMockMeasurement({
        id,
        name: 'Test Measurement',
      });

      service.getMeasurementById.mockResolvedValue(mockMeasurement);

      const result = await controller.getMeasurementById(id);

      expect(result.message).toBe('Measurement found');
      expect(result.data.id).toBe(id);
      expect(result.data.name).toBe('Test Measurement');
      expect(service.getMeasurementById).toHaveBeenCalledWith(id);
    });

    it('should propagate NotFoundException when measurement not found', async () => {
      const id = 999;

      service.getMeasurementById.mockRejectedValue(
        new NotFoundException(`Measurement with ID ${id} not found`)
      );

      await expect(controller.getMeasurementById(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateMeasurement', () => {
    it('should update measurement and return success response', async () => {
      const id = 1;
      const updateDto: UpdateMeasurementDto = { name: 'Updated Measurement' };
      const updatedMeasurement = createMockMeasurement({
        id,
        name: 'Updated Measurement',
      });

      service.updateMeasurement.mockResolvedValue(updatedMeasurement);

      const result = await controller.updateMeasurement(id, updateDto);

      expect(result.message).toBe('Measurement updated successfully');
      expect(result.data.name).toBe('Updated Measurement');
      expect(service.updateMeasurement).toHaveBeenCalledWith(id, updateDto);
    });
  });

  describe('deleteMeasurement', () => {
    it('should delete measurement successfully', async () => {
      const id = 1;

      service.deleteMeasurement.mockResolvedValue(undefined);

      await controller.deleteMeasurement(id);

      expect(service.deleteMeasurement).toHaveBeenCalledWith(id);
    });
  });

  describe('restoreMeasurement', () => {
    it('should restore measurement and return success message', async () => {
      const id = 1;

      service.restoreMeasurement.mockResolvedValue(undefined);

      const result = await controller.restoreMeasurement(id);

      expect(result.message).toBe('Measurement restored successfully');
      expect(service.restoreMeasurement).toHaveBeenCalledWith(id);
    });
  });

  describe('getMeasurementValues', () => {
    it('should return measurement values with default limit', async () => {
      const id = 1;
      const mockValues = [
        createMockMeasurementValue({ id: 1, measurementId: id, value: '25.5' }),
        createMockMeasurementValue({ id: 2, measurementId: id, value: '26.0' }),
      ];

      service.getMeasurementValues.mockResolvedValue(mockValues);

      const result = await controller.getMeasurementValues(id);

      expect(result.message).toBe('Measurement values retrieved successfully');
      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.limit).toBe(10);
      expect(service.getMeasurementValues).toHaveBeenCalledWith(id, 10);
    });

    it('should return measurement values with custom limit', async () => {
      const id = 1;
      const limit = 5;
      const mockValues = [
        createMockMeasurementValue({ id: 1, measurementId: id }),
      ];

      service.getMeasurementValues.mockResolvedValue(mockValues);

      const result = await controller.getMeasurementValues(id, limit);

      expect(result.limit).toBe(limit);
      expect(service.getMeasurementValues).toHaveBeenCalledWith(id, limit);
    });

    it('should propagate BadRequestException when limit exceeds 100', async () => {
      const id = 1;
      const limit = 101;

      service.getMeasurementValues.mockRejectedValue(
        new BadRequestException(
          'Limit cannot exceed 100. Please request 100 or fewer values.'
        )
      );

      await expect(controller.getMeasurementValues(id, limit)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should propagate NotFoundException when measurement not found', async () => {
      const id = 999;

      service.getMeasurementValues.mockRejectedValue(
        new NotFoundException(`Measurement with ID ${id} not found`)
      );

      await expect(controller.getMeasurementValues(id)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});

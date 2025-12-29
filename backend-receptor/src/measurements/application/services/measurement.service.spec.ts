import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { MeasurementRepository } from '../../domain/repositories/measurement.repository';
import { MeasurementValueRepository } from '../../domain/repositories/measurement-value.repository';
import {
  createMockMeasurement,
  createMockMeasurementValue,
} from '../../../test-helpers';
import type {
  CreateMeasurementDto,
  UpdateMeasurementDto,
} from '../dtos/measurement.dto';
import { MeasurementType } from '../../domain/entities/measurement.entity';
import type { MeasurementFilters } from '../../domain/repositories/measurement.repository';

describe('MeasurementService', () => {
  let service: MeasurementService;
  let measurementRepository: jest.Mocked<MeasurementRepository>;
  let measurementValueRepository: jest.Mocked<MeasurementValueRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasurementService,
        {
          provide: MeasurementRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByExternalId: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: MeasurementValueRepository,
          useValue: {
            findLatestByMeasurementId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MeasurementService>(MeasurementService);
    measurementRepository = module.get(MeasurementRepository);
    measurementValueRepository = module.get(MeasurementValueRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMeasurement', () => {
    it('should create measurement successfully when valid data is provided', async () => {
      const createDto: CreateMeasurementDto = {
        externalId: 'MEAS001',
        name: 'Temperature Sensor',
        type: MeasurementType.TEMPERATURE,
      };
      const mockMeasurement = createMockMeasurement(createDto);

      measurementRepository.create.mockResolvedValue(mockMeasurement);

      const result = await service.createMeasurement(createDto);

      expect(result).toEqual(mockMeasurement);
      expect(measurementRepository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('getAllMeasurements', () => {
    it('should return paginated measurements when filters are provided', async () => {
      const filters: MeasurementFilters = { limit: 10, offset: 0 };
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

      measurementRepository.findAll.mockResolvedValue({
        data: mockMeasurements,
        total: 2,
      });

      const result = await service.getAllMeasurements(filters);

      expect(result.data).toEqual(mockMeasurements);
      expect(result.total).toBe(2);
      expect(measurementRepository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return all measurements when no filters are provided', async () => {
      const mockMeasurements = [createMockMeasurement({ id: 1 })];
      measurementRepository.findAll.mockResolvedValue({
        data: mockMeasurements,
        total: 1,
      });

      const result = await service.getAllMeasurements();

      expect(result.data).toEqual(mockMeasurements);
      expect(result.total).toBe(1);
      expect(measurementRepository.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getMeasurementById', () => {
    it('should return measurement when found', async () => {
      const id = 1;
      const mockMeasurement = createMockMeasurement({ id });

      measurementRepository.findById.mockResolvedValue(mockMeasurement);

      const result = await service.getMeasurementById(id);

      expect(result).toEqual(mockMeasurement);
      expect(measurementRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when measurement not found', async () => {
      const id = 999;

      measurementRepository.findById.mockResolvedValue(null);

      await expect(service.getMeasurementById(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getMeasurementById(id)).rejects.toThrow(
        `Measurement with ID ${id} not found`
      );
    });
  });

  describe('getMeasurementByExternalId', () => {
    it('should return measurement when found', async () => {
      const externalId = 'MEAS001';
      const mockMeasurement = createMockMeasurement({ externalId });

      measurementRepository.findByExternalId.mockResolvedValue(mockMeasurement);

      const result = await service.getMeasurementByExternalId(externalId);

      expect(result).toEqual(mockMeasurement);
      expect(measurementRepository.findByExternalId).toHaveBeenCalledWith(
        externalId
      );
    });

    it('should return null when measurement not found', async () => {
      const externalId = 'NONEXISTENT';

      measurementRepository.findByExternalId.mockResolvedValue(null);

      const result = await service.getMeasurementByExternalId(externalId);

      expect(result).toBeNull();
    });
  });

  describe('updateMeasurement', () => {
    it('should update measurement successfully when valid data is provided', async () => {
      const id = 1;
      const updateDto: UpdateMeasurementDto = { name: 'Updated Measurement' };
      const updatedMeasurement = createMockMeasurement({
        id,
        name: 'Updated Measurement',
      });

      measurementRepository.update.mockResolvedValue(updatedMeasurement);

      const result = await service.updateMeasurement(id, updateDto);

      expect(result).toEqual(updatedMeasurement);
      expect(measurementRepository.update).toHaveBeenCalledWith(id, updateDto);
    });

    it('should throw NotFoundException when measurement does not exist', async () => {
      const id = 999;
      const updateDto: UpdateMeasurementDto = { name: 'Updated Measurement' };

      measurementRepository.update.mockResolvedValue(null);

      await expect(service.updateMeasurement(id, updateDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.updateMeasurement(id, updateDto)).rejects.toThrow(
        `Measurement with ID ${id} not found`
      );
    });
  });

  describe('deleteMeasurement', () => {
    it('should soft delete measurement successfully when measurement exists', async () => {
      const id = 1;

      measurementRepository.softDelete.mockResolvedValue(true);

      await service.deleteMeasurement(id);

      expect(measurementRepository.softDelete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when measurement does not exist', async () => {
      const id = 999;

      measurementRepository.softDelete.mockResolvedValue(false);

      await expect(service.deleteMeasurement(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.deleteMeasurement(id)).rejects.toThrow(
        `Measurement with ID ${id} not found`
      );
    });
  });

  describe('restoreMeasurement', () => {
    it('should restore measurement successfully when measurement is deleted', async () => {
      const id = 1;

      measurementRepository.restore.mockResolvedValue(true);

      await service.restoreMeasurement(id);

      expect(measurementRepository.restore).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundException when measurement does not exist', async () => {
      const id = 999;

      measurementRepository.restore.mockResolvedValue(false);

      await expect(service.restoreMeasurement(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.restoreMeasurement(id)).rejects.toThrow(
        `Measurement with ID ${id} not found`
      );
    });
  });

  describe('getMeasurementsCount', () => {
    it('should return count of measurements', async () => {
      const expectedCount = 5;

      measurementRepository.count.mockResolvedValue(expectedCount);

      const result = await service.getMeasurementsCount();

      expect(result).toBe(expectedCount);
      expect(measurementRepository.count).toHaveBeenCalled();
    });
  });

  describe('getMeasurementValues', () => {
    it('should return measurement values with default limit', async () => {
      const id = 1;
      const mockValues = [
        createMockMeasurementValue({ id: 1, measurementId: id, value: '25.5' }),
        createMockMeasurementValue({ id: 2, measurementId: id, value: '26.0' }),
      ];

      measurementRepository.findById.mockResolvedValue(
        createMockMeasurement({ id })
      );
      measurementValueRepository.findLatestByMeasurementId.mockResolvedValue(
        mockValues
      );

      const result = await service.getMeasurementValues(id);

      expect(result).toEqual(mockValues);
      expect(measurementRepository.findById).toHaveBeenCalledWith(id);
      expect(
        measurementValueRepository.findLatestByMeasurementId
      ).toHaveBeenCalledWith(id, 10);
    });

    it('should return measurement values with custom limit', async () => {
      const id = 1;
      const limit = 5;
      const mockValues = [
        createMockMeasurementValue({ id: 1, measurementId: id }),
      ];

      measurementRepository.findById.mockResolvedValue(
        createMockMeasurement({ id })
      );
      measurementValueRepository.findLatestByMeasurementId.mockResolvedValue(
        mockValues
      );

      const result = await service.getMeasurementValues(id, limit);

      expect(result).toEqual(mockValues);
      expect(
        measurementValueRepository.findLatestByMeasurementId
      ).toHaveBeenCalledWith(id, limit);
    });

    it('should throw BadRequestException when limit exceeds 100', async () => {
      const id = 1;
      const limit = 101;

      measurementRepository.findById.mockResolvedValue(
        createMockMeasurement({ id })
      );

      await expect(service.getMeasurementValues(id, limit)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.getMeasurementValues(id, limit)).rejects.toThrow(
        'Limit cannot exceed 100. Please request 100 or fewer values.'
      );
    });

    it('should throw BadRequestException when limit is less than 1', async () => {
      const id = 1;
      const limit = 0;

      measurementRepository.findById.mockResolvedValue(
        createMockMeasurement({ id })
      );

      await expect(service.getMeasurementValues(id, limit)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.getMeasurementValues(id, limit)).rejects.toThrow(
        'Limit must be at least 1.'
      );
    });

    it('should throw NotFoundException when measurement does not exist', async () => {
      const id = 999;

      measurementRepository.findById.mockResolvedValue(null);

      await expect(service.getMeasurementValues(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getMeasurementValues(id)).rejects.toThrow(
        `Measurement with ID ${id} not found`
      );
    });
  });
});

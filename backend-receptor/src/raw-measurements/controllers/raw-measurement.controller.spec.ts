import { Test, type TestingModule } from '@nestjs/testing';
import { RawMeasurementController } from './raw-measurement.controller';
import { RawMeasurementService } from '../application/services/raw-measurement.service';
import { createMockRawMeasurement } from '../../test-helpers';

describe('RawMeasurementController', () => {
  let controller: RawMeasurementController;
  let service: jest.Mocked<RawMeasurementService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RawMeasurementController],
      providers: [
        {
          provide: RawMeasurementService,
          useValue: {
            processMeasurement: jest.fn(),
            getAllMeasurements: jest.fn(),
            getMeasurementById: jest.fn(),
            getMeasurementsByExternalId: jest.fn(),
            getMeasurementsCount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RawMeasurementController>(RawMeasurementController);
    service = module.get(RawMeasurementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMeasurement', () => {
    it('should process measurement successfully', async () => {
      const rawMeasurementDto = {
        id: 'MEAS001',
        value: '100.5',
      };
      const mockMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: rawMeasurementDto.id,
        value: rawMeasurementDto.value,
      });

      service.processMeasurement.mockResolvedValue(mockMeasurement);

      const result = await controller.createMeasurement(rawMeasurementDto);

      expect(result).toEqual({
        message: 'Measurement processed successfully',
        data: mockMeasurement,
      });
      expect(service.processMeasurement).toHaveBeenCalledWith(
        rawMeasurementDto.id,
        rawMeasurementDto.value
      );
    });
  });

  describe('getAllMeasurements', () => {
    it('should return paginated list', async () => {
      const mockMeasurements = [
        createMockRawMeasurement({ id: 1 }),
        createMockRawMeasurement({ id: 2 }),
      ];
      const mockResult = { data: mockMeasurements, total: 2 };

      service.getAllMeasurements.mockResolvedValue(mockResult);

      const result = await controller.getAllMeasurements();

      expect(result).toEqual({
        message: 'Measurements retrieved successfully',
        data: mockMeasurements,
        total: 2,
        pagination: {
          limit: 10,
          offset: 0,
          total: 2,
        },
      });
      expect(service.getAllMeasurements).toHaveBeenCalledWith({});
    });

    it('should apply filters when provided', async () => {
      const externalId = 'MEAS001';
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const limit = 20;
      const offset = 10;
      const mockResult = { data: [], total: 0 };

      service.getAllMeasurements.mockResolvedValue(mockResult);

      await controller.getAllMeasurements(
        externalId,
        limit,
        offset,
        startDate,
        endDate
      );

      expect(service.getAllMeasurements).toHaveBeenCalledWith({
        externalId,
        limit,
        offset,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    });
  });

  describe('getMeasurementsCount', () => {
    it('should return count of measurements', async () => {
      const count = 100;
      service.getMeasurementsCount.mockResolvedValue(count);

      const result = await controller.getMeasurementsCount();

      expect(result).toEqual({
        message: 'Measurements count retrieved successfully',
        count,
      });
      expect(service.getMeasurementsCount).toHaveBeenCalled();
    });
  });

  describe('getMeasurementById', () => {
    it('should return measurement when exists', async () => {
      const id = 1;
      const mockMeasurement = createMockRawMeasurement({ id });

      service.getMeasurementById.mockResolvedValue(mockMeasurement);

      const result = await controller.getMeasurementById(id);

      expect(result).toEqual({
        message: 'Measurement found',
        data: mockMeasurement,
      });
      expect(service.getMeasurementById).toHaveBeenCalledWith(id);
    });

    it('should return null when measurement does not exist', async () => {
      const id = 999;
      service.getMeasurementById.mockResolvedValue(null);

      const result = await controller.getMeasurementById(id);

      expect(result).toEqual({
        message: 'Measurement not found',
        data: null,
      });
    });
  });

  describe('getMeasurementsByExternalId', () => {
    it('should return measurements by externalId', async () => {
      const externalId = 'MEAS001';
      const mockMeasurements = [
        createMockRawMeasurement({ id: 1, externalId }),
      ];

      service.getMeasurementsByExternalId.mockResolvedValue(mockMeasurements);

      const result = await controller.getMeasurementsByExternalId(externalId);

      expect(result).toEqual({
        message: 'Measurements retrieved successfully',
        data: mockMeasurements,
      });
      expect(service.getMeasurementsByExternalId).toHaveBeenCalledWith(
        externalId
      );
    });
  });
});

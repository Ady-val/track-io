import { Test, type TestingModule } from '@nestjs/testing';
import { RawMeasurementService } from './raw-measurement.service';
import { RawMeasurementRepository } from '../../domain/repositories/raw-measurement.repository';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import { MeasurementValueRepository } from '../../../measurements/domain/repositories/measurement-value.repository';
import { AlertEvaluationService } from '../../../alert-rules/application/services/alert-evaluation.service';
import type { MeasurementValue } from '../../../measurements/domain/entities/measurement-value.entity';
import {
  createMockRawMeasurement,
  createMockMeasurement,
} from '../../../test-helpers';
import type { RawMeasurementFilters } from '../../domain/repositories/raw-measurement.repository';

describe('RawMeasurementService', () => {
  let service: RawMeasurementService;
  let repository: jest.Mocked<RawMeasurementRepository>;
  let webSocketEmitterService: jest.Mocked<WebSocketEmitterService>;
  let measurementService: jest.Mocked<MeasurementService>;
  let measurementValueRepository: jest.Mocked<MeasurementValueRepository>;
  let alertEvaluationService: jest.Mocked<AlertEvaluationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RawMeasurementService,
        {
          provide: RawMeasurementRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByExternalId: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: WebSocketEmitterService,
          useValue: {
            emitNewRawMeasurement: jest.fn(),
          },
        },
        {
          provide: MeasurementService,
          useValue: {
            getMeasurementByExternalId: jest.fn(),
          },
        },
        {
          provide: MeasurementValueRepository,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: AlertEvaluationService,
          useValue: {
            evaluateMeasurement: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RawMeasurementService>(RawMeasurementService);
    repository = module.get(RawMeasurementRepository);
    webSocketEmitterService = module.get(WebSocketEmitterService);
    measurementService = module.get(MeasurementService);
    measurementValueRepository = module.get(MeasurementValueRepository);
    alertEvaluationService = module.get(AlertEvaluationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processMeasurement', () => {
    it('should process measurement successfully', async () => {
      const id = 'MEAS001';
      const value = '100.5';
      const mockMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: id,
        value,
      });
      const mockMeasurementEntity = createMockMeasurement({
        id: 1,
        externalId: id,
      });

      repository.create.mockResolvedValue(mockMeasurement);
      measurementService.getMeasurementByExternalId.mockResolvedValue(
        mockMeasurementEntity
      );
      measurementValueRepository.create.mockResolvedValue(
        undefined as unknown as MeasurementValue
      );
      alertEvaluationService.evaluateMeasurement.mockResolvedValue(undefined);

      const result = await service.processMeasurement(id, value);

      expect(result).toEqual(mockMeasurement);
      expect(repository.create).toHaveBeenCalledWith({
        externalId: id,
        value,
      });
      expect(
        measurementService.getMeasurementByExternalId
      ).toHaveBeenCalledWith(id);
      expect(measurementValueRepository.create).toHaveBeenCalled();
      expect(webSocketEmitterService.emitNewRawMeasurement).toHaveBeenCalled();
      expect(alertEvaluationService.evaluateMeasurement).toHaveBeenCalledWith(
        mockMeasurement
      );
    });

    it('should continue processing when Measurement does not exist', async () => {
      const id = 'MEAS001';
      const value = '100.5';
      const mockMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: id,
        value,
      });

      repository.create.mockResolvedValue(mockMeasurement);
      measurementService.getMeasurementByExternalId.mockResolvedValue(null);
      alertEvaluationService.evaluateMeasurement.mockResolvedValue(undefined);

      const result = await service.processMeasurement(id, value);

      expect(result).toEqual(mockMeasurement);
      expect(measurementValueRepository.create).not.toHaveBeenCalled();
    });

    it('should continue processing when WebSocket emission fails', async () => {
      const id = 'MEAS001';
      const value = '100.5';
      const mockMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: id,
        value,
      });

      repository.create.mockResolvedValue(mockMeasurement);
      measurementService.getMeasurementByExternalId.mockResolvedValue(null);
      webSocketEmitterService.emitNewRawMeasurement.mockImplementation(() => {
        throw new Error('WebSocket error');
      });
      alertEvaluationService.evaluateMeasurement.mockResolvedValue(undefined);

      const result = await service.processMeasurement(id, value);

      expect(result).toEqual(mockMeasurement);
    });

    it('should continue processing when alert evaluation fails', async () => {
      const id = 'MEAS001';
      const value = '100.5';
      const mockMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: id,
        value,
      });

      repository.create.mockResolvedValue(mockMeasurement);
      measurementService.getMeasurementByExternalId.mockResolvedValue(null);
      alertEvaluationService.evaluateMeasurement.mockRejectedValue(
        new Error('Alert evaluation error')
      );

      const result = await service.processMeasurement(id, value);

      expect(result).toEqual(mockMeasurement);
    });

    it('should throw error when creating RawMeasurement fails', async () => {
      const id = 'MEAS001';
      const value = '100.5';
      const error = new Error('Database error');

      repository.create.mockRejectedValue(error);

      await expect(service.processMeasurement(id, value)).rejects.toThrow(
        error
      );
    });
  });

  describe('getAllMeasurements', () => {
    it('should return paginated list with filters', async () => {
      const filters: RawMeasurementFilters = { limit: 10, offset: 0 };
      const mockMeasurements = [
        createMockRawMeasurement({ id: 1 }),
        createMockRawMeasurement({ id: 2 }),
      ];
      const mockResult = { data: mockMeasurements, total: 2 };

      repository.findAll.mockResolvedValue(mockResult);

      const result = await service.getAllMeasurements(filters);

      expect(result).toEqual(mockResult);
      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should apply filters correctly', async () => {
      const filters: RawMeasurementFilters = {
        externalId: 'MEAS001',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      const mockResult = { data: [], total: 0 };

      repository.findAll.mockResolvedValue(mockResult);

      await service.getAllMeasurements(filters);

      expect(repository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('getMeasurementById', () => {
    it('should return measurement when exists', async () => {
      const id = 1;
      const mockMeasurement = createMockRawMeasurement({ id });

      repository.findById.mockResolvedValue(mockMeasurement);

      const result = await service.getMeasurementById(id);

      expect(result).toEqual(mockMeasurement);
      expect(repository.findById).toHaveBeenCalledWith(id);
    });

    it('should return null when measurement does not exist', async () => {
      const id = 999;
      repository.findById.mockResolvedValue(null);

      const result = await service.getMeasurementById(id);

      expect(result).toBeNull();
    });
  });

  describe('getMeasurementsByExternalId', () => {
    it('should return array of measurements', async () => {
      const externalId = 'MEAS001';
      const mockMeasurements = [
        createMockRawMeasurement({ id: 1, externalId }),
        createMockRawMeasurement({ id: 2, externalId }),
      ];

      repository.findByExternalId.mockResolvedValue(mockMeasurements);

      const result = await service.getMeasurementsByExternalId(externalId);

      expect(result).toEqual(mockMeasurements);
      expect(repository.findByExternalId).toHaveBeenCalledWith(externalId);
    });
  });

  describe('getMeasurementsCount', () => {
    it('should return count of measurements', async () => {
      const count = 100;
      repository.count.mockResolvedValue(count);

      const result = await service.getMeasurementsCount();

      expect(result).toBe(count);
      expect(repository.count).toHaveBeenCalled();
    });
  });
});

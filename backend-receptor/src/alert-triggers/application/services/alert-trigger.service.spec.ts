import { Test, type TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AlertTriggerService } from './alert-trigger.service';
import { AlertTriggerRepository } from '../../domain/repositories/alert-trigger.repository';
import {
  createMockAlertTrigger,
  createMockAlertRule,
} from '../../../test-helpers';
import type { AlertTriggerFilters } from '../../domain/repositories/alert-trigger.repository';

describe('AlertTriggerService', () => {
  let service: AlertTriggerService;
  let repository: jest.Mocked<AlertTriggerRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertTriggerService,
        {
          provide: AlertTriggerRepository,
          useValue: {
            findWithFilters: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findByAlertRuleId: jest.fn(),
            getStatsForAlertRule: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertTriggerService>(AlertTriggerService);
    repository = module.get(AlertTriggerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAlertTriggers', () => {
    it('should return paginated list with filters', async () => {
      const filters: AlertTriggerFilters = { limit: 10, offset: 0 };
      const mockTriggers = [
        createMockAlertTrigger({ id: 1 }),
        createMockAlertTrigger({ id: 2 }),
      ];
      const mockResult = { data: mockTriggers, total: 2 };

      repository.findWithFilters.mockResolvedValue(mockResult);

      const result = await service.getAllAlertTriggers(filters);

      expect(result).toEqual(mockResult);
      expect(repository.findWithFilters).toHaveBeenCalledWith(filters);
    });

    it('should apply filters correctly', async () => {
      const filters: AlertTriggerFilters = {
        alertRuleId: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      const mockResult = { data: [], total: 0 };

      repository.findWithFilters.mockResolvedValue(mockResult);

      await service.getAllAlertTriggers(filters);

      expect(repository.findWithFilters).toHaveBeenCalledWith(filters);
    });
  });

  describe('getAlertTriggerById', () => {
    it('should return trigger when exists', async () => {
      const id = 1;
      const mockTrigger = createMockAlertTrigger({ id });
      const mockAlertRule = createMockAlertRule({ id: 1 });
      mockTrigger.alertRule = mockAlertRule;

      repository.findOne.mockResolvedValue(mockTrigger);

      const result = await service.getAlertTriggerById(id);

      expect(result).toEqual(mockTrigger);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['alertRule', 'alertRule.measurement'],
      });
    });

    it('should throw NotFoundException when trigger does not exist', async () => {
      const id = 999;
      repository.findOne.mockResolvedValue(null);

      await expect(service.getAlertTriggerById(id)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.getAlertTriggerById(id)).rejects.toThrow(
        `Alert trigger with ID ${id} not found`
      );
    });
  });

  describe('createAlertTrigger', () => {
    it('should create trigger successfully', async () => {
      const createDto = {
        alertRuleId: 1,
        rawMeasurementId: 1,
        measurementValue: 100.5,
        conditionResult: 'value > 100',
        messagesTriggered: [1, 2],
      };
      const mockTrigger = createMockAlertTrigger({ id: 1, ...createDto });

      repository.create.mockReturnValue(mockTrigger);
      repository.save.mockResolvedValue(mockTrigger);

      const result = await service.createAlertTrigger(createDto);

      expect(result).toEqual(mockTrigger);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockTrigger);
    });
  });

  describe('getTriggersByAlertRuleId', () => {
    it('should return triggers for alert rule', async () => {
      const alertRuleId = 1;
      const mockTriggers = [
        createMockAlertTrigger({ id: 1, alertRuleId }),
        createMockAlertTrigger({ id: 2, alertRuleId }),
      ];

      repository.findByAlertRuleId.mockResolvedValue(mockTriggers);

      const result = await service.getTriggersByAlertRuleId(alertRuleId);

      expect(result).toEqual(mockTriggers);
      expect(repository.findByAlertRuleId).toHaveBeenCalledWith(alertRuleId);
    });
  });

  describe('getAlertRuleStats', () => {
    it('should return stats for alert rule', async () => {
      const alertRuleId = 1;
      const mockStats = {
        totalTriggers: 10,
        lastTriggeredAt: new Date(),
        avgValue: 100.5,
        minValue: 50.0,
        maxValue: 150.0,
      };

      repository.getStatsForAlertRule.mockResolvedValue(mockStats);

      const result = await service.getAlertRuleStats(alertRuleId);

      expect(result).toEqual(mockStats);
      expect(repository.getStatsForAlertRule).toHaveBeenCalledWith(alertRuleId);
    });

    it('should return zero stats when no triggers exist', async () => {
      const alertRuleId = 999;
      const mockStats = {
        totalTriggers: 0,
        lastTriggeredAt: null,
        avgValue: 0,
        minValue: 0,
        maxValue: 0,
      };

      repository.getStatsForAlertRule.mockResolvedValue(mockStats);

      const result = await service.getAlertRuleStats(alertRuleId);

      expect(result).toEqual(mockStats);
    });
  });
});

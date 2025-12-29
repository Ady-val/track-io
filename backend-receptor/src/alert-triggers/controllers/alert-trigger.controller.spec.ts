import { Test, type TestingModule } from '@nestjs/testing';
import { AlertTriggerController } from './alert-trigger.controller';
import { AlertTriggerService } from '../application/services/alert-trigger.service';
import { createMockAlertTrigger } from '../../test-helpers';

describe('AlertTriggerController', () => {
  let controller: AlertTriggerController;
  let service: jest.Mocked<AlertTriggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertTriggerController],
      providers: [
        {
          provide: AlertTriggerService,
          useValue: {
            getAllAlertTriggers: jest.fn(),
            getAlertTriggerById: jest.fn(),
            getTriggersByAlertRuleId: jest.fn(),
            getAlertRuleStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AlertTriggerController>(AlertTriggerController);
    service = module.get(AlertTriggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAlertTriggers', () => {
    it('should return paginated list', async () => {
      const mockTriggers = [
        createMockAlertTrigger({ id: 1 }),
        createMockAlertTrigger({ id: 2 }),
      ];
      const mockResult = { data: mockTriggers, total: 2 };

      service.getAllAlertTriggers.mockResolvedValue(mockResult);

      const result = await controller.getAllAlertTriggers();

      expect(result).toEqual({
        message: 'Alert triggers retrieved successfully',
        data: mockTriggers,
        total: 2,
        pagination: {
          limit: 50,
          offset: 0,
          total: 2,
        },
      });
      expect(service.getAllAlertTriggers).toHaveBeenCalledWith({});
    });

    it('should apply filters when provided', async () => {
      const alertRuleId = '1';
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const limit = 20;
      const offset = 10;
      const mockResult = { data: [], total: 0 };

      service.getAllAlertTriggers.mockResolvedValue(mockResult);

      await controller.getAllAlertTriggers(
        alertRuleId,
        startDate,
        endDate,
        limit,
        offset
      );

      expect(service.getAllAlertTriggers).toHaveBeenCalledWith({
        alertRuleId: 1,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        limit,
        offset,
      });
    });
  });

  describe('getAlertTriggerById', () => {
    it('should return trigger by ID', async () => {
      const id = 1;
      const mockTrigger = createMockAlertTrigger({ id });

      service.getAlertTriggerById.mockResolvedValue(mockTrigger);

      const result = await controller.getAlertTriggerById(id);

      expect(result).toEqual({
        message: 'Alert trigger found',
        data: mockTrigger,
      });
      expect(service.getAlertTriggerById).toHaveBeenCalledWith(id);
    });
  });

  describe('getTriggersByAlertRuleId', () => {
    it('should return triggers for alert rule', async () => {
      const ruleId = 1;
      const mockTriggers = [
        createMockAlertTrigger({ id: 1, alertRuleId: ruleId }),
      ];

      service.getTriggersByAlertRuleId.mockResolvedValue(mockTriggers);

      const result = await controller.getTriggersByAlertRuleId(ruleId);

      expect(result).toEqual({
        message: 'Alert rule triggers retrieved successfully',
        data: mockTriggers,
      });
      expect(service.getTriggersByAlertRuleId).toHaveBeenCalledWith(ruleId);
    });
  });

  describe('getAlertRuleStats', () => {
    it('should return stats for alert rule', async () => {
      const ruleId = 1;
      const mockStats = {
        totalTriggers: 10,
        lastTriggeredAt: new Date(),
        avgValue: 100.5,
        minValue: 50.0,
        maxValue: 150.0,
      };

      service.getAlertRuleStats.mockResolvedValue(mockStats);

      const result = await controller.getAlertRuleStats(ruleId);

      expect(result).toEqual({
        message: 'Alert rule stats retrieved successfully',
        data: mockStats,
      });
      expect(service.getAlertRuleStats).toHaveBeenCalledWith(ruleId);
    });
  });
});

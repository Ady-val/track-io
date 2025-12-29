import { Test, type TestingModule } from '@nestjs/testing';
import { EventAlertLogController } from './event-alert-log.controller';
import { EventAlertLogService } from '../application/services/event-alert-log.service';
import { createMockEventAlertLog } from '../../test-helpers';
import { AlertLevel } from '../domain/entities/alert-escalation-message.entity';

describe('EventAlertLogController', () => {
  let controller: EventAlertLogController;
  let service: jest.Mocked<EventAlertLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventAlertLogController],
      providers: [
        {
          provide: EventAlertLogService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEvent: jest.fn(),
            findSuccessfulByEvent: jest.fn(),
            findFailedByEvent: jest.fn(),
            findByLevel: jest.fn(),
            count: jest.fn(),
            countByEvent: jest.fn(),
            countByLevel: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EventAlertLogController>(EventAlertLogController);
    service = module.get(EventAlertLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEvent', () => {
    it('should return logs for event', async () => {
      const eventId = 1;
      const mockLogs = [
        createMockEventAlertLog({ id: 1, eventId }),
        createMockEventAlertLog({ id: 2, eventId }),
      ];

      service.findByEvent.mockResolvedValue(mockLogs);

      const result = await controller.findByEvent(eventId);

      expect(result).toEqual(mockLogs);
      expect(service.findByEvent).toHaveBeenCalledWith(eventId);
    });
  });

  describe('findSuccessfulByEvent', () => {
    it('should return successful logs for event', async () => {
      const eventId = 1;
      const mockLogs = [
        createMockEventAlertLog({ id: 1, eventId, success: true }),
      ];

      service.findSuccessfulByEvent.mockResolvedValue(mockLogs);

      const result = await controller.findSuccessfulByEvent(eventId);

      expect(result).toEqual(mockLogs);
      expect(service.findSuccessfulByEvent).toHaveBeenCalledWith(eventId);
    });
  });

  describe('findFailedByEvent', () => {
    it('should return failed logs for event', async () => {
      const eventId = 1;
      const mockLogs = [
        createMockEventAlertLog({
          id: 1,
          eventId,
          success: false,
          errorMessage: 'Error',
        }),
      ];

      service.findFailedByEvent.mockResolvedValue(mockLogs);

      const result = await controller.findFailedByEvent(eventId);

      expect(result).toEqual(mockLogs);
      expect(service.findFailedByEvent).toHaveBeenCalledWith(eventId);
    });
  });

  describe('getCount', () => {
    it('should return total count', async () => {
      const count = 10;

      service.count.mockResolvedValue(count);

      const result = await controller.getCount();

      expect(result.count).toBe(count);
      expect(service.count).toHaveBeenCalled();
    });
  });

  describe('getCountByEvent', () => {
    it('should return count for event', async () => {
      const eventId = 1;
      const count = 5;

      service.countByEvent.mockResolvedValue(count);

      const result = await controller.getCountByEvent(eventId);

      expect(result.count).toBe(count);
      expect(service.countByEvent).toHaveBeenCalledWith(eventId);
    });
  });

  describe('getCountByLevel', () => {
    it('should return count for level', async () => {
      const level = AlertLevel.WARNING;
      const count = 3;

      service.countByLevel.mockResolvedValue(count);

      const result = await controller.getCountByLevel(level);

      expect(result.count).toBe(count);
      expect(service.countByLevel).toHaveBeenCalledWith(level);
    });
  });
});

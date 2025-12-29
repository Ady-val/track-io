import { Test, type TestingModule } from '@nestjs/testing';
import { EventAlertLogService } from './event-alert-log.service';
import { EventAlertLogRepository } from '../../domain/repositories/event-alert-log.repository';
import { createMockEventAlertLog } from '../../../test-helpers';
import { AlertLevel } from '../../domain/entities/alert-escalation-message.entity';

describe('EventAlertLogService', () => {
  let service: EventAlertLogService;
  let logRepository: jest.Mocked<EventAlertLogRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventAlertLogService,
        {
          provide: EventAlertLogRepository,
          useValue: {
            findByEvent: jest.fn(),
            findById: jest.fn(),
            findByEventAndLevel: jest.fn(),
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

    service = module.get<EventAlertLogService>(EventAlertLogService);
    logRepository = module.get(EventAlertLogRepository);
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

      logRepository.findByEvent.mockResolvedValue(mockLogs);

      const result = await service.findByEvent(eventId);

      expect(result).toEqual(mockLogs);
      expect(logRepository.findByEvent).toHaveBeenCalledWith(eventId);
    });
  });

  describe('findByEventAndLevel', () => {
    it('should return log for event and level', async () => {
      const eventId = 1;
      const level = AlertLevel.WARNING;
      const mockLog = createMockEventAlertLog({
        id: 1,
        eventId,
        level,
      });

      logRepository.findByEventAndLevel.mockResolvedValue(mockLog);

      const result = await service.findByEventAndLevel(eventId, level);

      expect(result).toEqual(mockLog);
      expect(logRepository.findByEventAndLevel).toHaveBeenCalledWith(
        eventId,
        level
      );
    });
  });

  describe('findSuccessfulByEvent', () => {
    it('should return successful logs for event', async () => {
      const eventId = 1;
      const mockLogs = [
        createMockEventAlertLog({ id: 1, eventId, success: true }),
      ];

      logRepository.findSuccessfulByEvent.mockResolvedValue(mockLogs);

      const result = await service.findSuccessfulByEvent(eventId);

      expect(result).toEqual(mockLogs);
      expect(logRepository.findSuccessfulByEvent).toHaveBeenCalledWith(eventId);
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
          errorMessage: 'Error message',
        }),
      ];

      logRepository.findFailedByEvent.mockResolvedValue(mockLogs);

      const result = await service.findFailedByEvent(eventId);

      expect(result).toEqual(mockLogs);
      expect(logRepository.findFailedByEvent).toHaveBeenCalledWith(eventId);
    });
  });

  describe('count', () => {
    it('should return total log count', async () => {
      const count = 10;

      logRepository.count.mockResolvedValue(count);

      const result = await service.count();

      expect(result).toBe(count);
      expect(logRepository.count).toHaveBeenCalled();
    });
  });

  describe('countByEvent', () => {
    it('should return log count for event', async () => {
      const eventId = 1;
      const count = 5;

      logRepository.countByEvent.mockResolvedValue(count);

      const result = await service.countByEvent(eventId);

      expect(result).toBe(count);
      expect(logRepository.countByEvent).toHaveBeenCalledWith(eventId);
    });
  });

  describe('countByLevel', () => {
    it('should return log count for level', async () => {
      const level = AlertLevel.WARNING;
      const count = 3;

      logRepository.countByLevel.mockResolvedValue(count);

      const result = await service.countByLevel(level);

      expect(result).toBe(count);
      expect(logRepository.countByLevel).toHaveBeenCalledWith(level);
    });
  });
});

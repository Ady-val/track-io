import { Test, type TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AlertEscalationService } from './alert-escalation.service';
import { AlertEscalationConfigRepository } from '../../domain/repositories/alert-escalation-config.repository';
import { AlertEscalationMessageRepository } from '../../domain/repositories/alert-escalation-message.repository';
import { EventAlertLogRepository } from '../../domain/repositories/event-alert-log.repository';
import { TorretaColorService } from '../../../torreta-colors/application/services/torreta-color.service';
import type { EventAlertLog } from '../../domain/entities/event-alert-log.entity';
import {
  createMockAlertEscalationConfig,
  createMockAlertEscalationMessage,
  createMockEvent,
} from '../../../test-helpers';
import {
  AlertLevel,
  MessageType,
} from '../../domain/entities/alert-escalation-message.entity';

describe('AlertEscalationService', () => {
  let service: AlertEscalationService;
  let configRepository: jest.Mocked<AlertEscalationConfigRepository>;
  let messageRepository: jest.Mocked<AlertEscalationMessageRepository>;
  let logRepository: jest.Mocked<EventAlertLogRepository>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertEscalationService,
        {
          provide: AlertEscalationConfigRepository,
          useValue: {
            findByDeviceAndSignal: jest.fn(),
          },
        },
        {
          provide: AlertEscalationMessageRepository,
          useValue: {
            findByConfigAndLevel: jest.fn(),
          },
        },
        {
          provide: EventAlertLogRepository,
          useValue: {
            findByEventAndLevel: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: TorretaColorService,
          useValue: {
            getTorretaColorByHtmlColor: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertEscalationService>(AlertEscalationService);
    configRepository = module.get<AlertEscalationConfigRepository>(
      AlertEscalationConfigRepository
    ) as jest.Mocked<AlertEscalationConfigRepository>;
    messageRepository = module.get<AlertEscalationMessageRepository>(
      AlertEscalationMessageRepository
    ) as jest.Mocked<AlertEscalationMessageRepository>;
    logRepository = module.get<EventAlertLogRepository>(
      EventAlertLogRepository
    ) as jest.Mocked<EventAlertLogRepository>;
    httpService = module.get<HttpService>(
      HttpService
    ) as jest.Mocked<HttpService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findConfigByDeviceAndSignal', () => {
    it('should return config when found', async () => {
      const deviceId = 1;
      const deviceSignalId = 1;
      const mockConfig = createMockAlertEscalationConfig({
        deviceId,
        deviceSignalId,
      });

      configRepository.findByDeviceAndSignal.mockResolvedValue(mockConfig);

      const result = await service.findConfigByDeviceAndSignal(
        deviceId,
        deviceSignalId
      );

      expect(result).toEqual(mockConfig);
      expect(configRepository.findByDeviceAndSignal).toHaveBeenCalledWith(
        deviceId,
        deviceSignalId
      );
    });
  });

  describe('getMessagesByLevel', () => {
    it('should return messages for config and level', async () => {
      const configId = 1;
      const level = AlertLevel.WARNING;
      const mockMessages = [
        createMockAlertEscalationMessage({
          id: 1,
          escalationConfigId: configId,
          level,
        }),
      ];

      messageRepository.findByConfigAndLevel.mockResolvedValue(mockMessages);

      const result = await service.getMessagesByLevel(configId, level);

      expect(result).toEqual(mockMessages);
      expect(messageRepository.findByConfigAndLevel).toHaveBeenCalledWith(
        configId,
        level
      );
    });
  });

  describe('hasLevelBeenSent', () => {
    it('should return true when level has been sent', async () => {
      const eventId = 1;
      const level = AlertLevel.WARNING;
      const mockLog = {
        id: 1,
        eventId,
        level,
      };

      logRepository.findByEventAndLevel.mockResolvedValue(mockLog);

      const result = await service.hasLevelBeenSent(eventId, level);

      expect(result).toBe(true);
      expect(logRepository.findByEventAndLevel).toHaveBeenCalledWith(
        eventId,
        level
      );
    });

    it('should return false when level has not been sent', async () => {
      const eventId = 1;
      const level = AlertLevel.WARNING;

      logRepository.findByEventAndLevel.mockResolvedValue(null);

      const result = await service.hasLevelBeenSent(eventId, level);

      expect(result).toBe(false);
    });
  });

  describe('determineLevelToSend', () => {
    it('should return ALERT when time is less than warning delay', () => {
      const config = createMockAlertEscalationConfig({
        warningDelayMinutes: 20,
      });
      const timeElapsedMinutes = 10;

      const result = service.determineLevelToSend(timeElapsedMinutes, config);

      expect(result).toBe(AlertLevel.ALERT);
    });

    it('should return WARNING when time is between warning and escalation1', () => {
      const config = createMockAlertEscalationConfig({
        warningDelayMinutes: 20,
        escalation1DelayMinutes: 40,
      });
      const timeElapsedMinutes = 30;

      const result = service.determineLevelToSend(timeElapsedMinutes, config);

      expect(result).toBe(AlertLevel.WARNING);
    });

    it('should return ESCALATION1 when time is between escalation1 and escalation2', () => {
      const config = createMockAlertEscalationConfig({
        escalation1DelayMinutes: 40,
        escalation2DelayMinutes: 60,
      });
      const timeElapsedMinutes = 50;

      const result = service.determineLevelToSend(timeElapsedMinutes, config);

      expect(result).toBe(AlertLevel.ESCALATION1);
    });

    it('should return ESCALATION2 when time is between escalation2 and escalation3', () => {
      const config = createMockAlertEscalationConfig({
        escalation2DelayMinutes: 60,
        escalation3DelayMinutes: 80,
      });
      const timeElapsedMinutes = 70;

      const result = service.determineLevelToSend(timeElapsedMinutes, config);

      expect(result).toBe(AlertLevel.ESCALATION2);
    });

    it('should return ESCALATION3 when time is greater than escalation3', () => {
      const config = createMockAlertEscalationConfig({
        escalation3DelayMinutes: 80,
      });
      const timeElapsedMinutes = 100;

      const result = service.determineLevelToSend(timeElapsedMinutes, config);

      expect(result).toBe(AlertLevel.ESCALATION3);
    });
  });

  describe('sendMessagesToEndpoint', () => {
    it('should send messages successfully', async () => {
      const messages = [
        createMockAlertEscalationMessage({
          id: 1,
          messageType: MessageType.EMAIL,
          targetId: 'test@example.com',
          message: 'Test message',
        }),
      ];
      const endpointUrl = 'http://test.com/endpoint';
      const mockResponse = {
        status: 200,
        data: {},
      };

      httpService.post.mockReturnValue(
        of(mockResponse) as unknown as ReturnType<typeof httpService.post>
      );

      const result = await service.sendMessagesToEndpoint(
        messages,
        endpointUrl
      );

      expect(result).toBe(true);
      expect(httpService.post).toHaveBeenCalled();
    });

    it('should return false when HTTP request fails', async () => {
      const messages = [
        createMockAlertEscalationMessage({
          id: 1,
          messageType: MessageType.EMAIL,
        }),
      ];
      const endpointUrl = 'http://test.com/endpoint';

      httpService.post.mockReturnValue(
        throwError(() => new Error('Network error')) as unknown as ReturnType<
          typeof httpService.post
        >
      );

      const result = await service.sendMessagesToEndpoint(
        messages,
        endpointUrl
      );

      expect(result).toBe(false);
    });
  });

  describe('sendAlertForLevel', () => {
    it('should skip sending if level already sent', async () => {
      const event = createMockEvent({ id: 1 });
      const config = createMockAlertEscalationConfig({ id: 1 });
      const level = AlertLevel.WARNING;

      logRepository.findByEventAndLevel.mockResolvedValue({
        id: 1,
        eventId: event.id,
        level,
      } as EventAlertLog);

      await service.sendAlertForLevel(event, config, level);

      expect(messageRepository.findByConfigAndLevel).not.toHaveBeenCalled();
    });

    it('should send alert when level not sent', async () => {
      const event = createMockEvent({ id: 1 });
      const config = createMockAlertEscalationConfig({
        id: 1,
        endpointUrl: 'http://test.com/endpoint',
      });
      const level = AlertLevel.WARNING;
      const messages = [
        createMockAlertEscalationMessage({
          id: 1,
          escalationConfigId: config.id,
          level,
          messageType: MessageType.EMAIL,
        }),
      ];
      const mockResponse = {
        status: 200,
        data: {},
      };

      logRepository.findByEventAndLevel.mockResolvedValue(null);
      messageRepository.findByConfigAndLevel.mockResolvedValue(messages);
      httpService.post.mockReturnValue(
        of(mockResponse) as unknown as ReturnType<typeof httpService.post>
      );
      logRepository.create.mockResolvedValue({
        id: 1,
        eventId: event.id,
        level,
      } as EventAlertLog);

      await service.sendAlertForLevel(event, config, level);

      expect(messageRepository.findByConfigAndLevel).toHaveBeenCalledWith(
        config.id,
        level
      );
      expect(httpService.post).toHaveBeenCalled();
      expect(logRepository.create).toHaveBeenCalled();
    });
  });
});

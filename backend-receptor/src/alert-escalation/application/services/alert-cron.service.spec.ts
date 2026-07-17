import { Test, type TestingModule } from '@nestjs/testing';
import { AlertCronService } from './alert-cron.service';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { AlertEscalationService } from './alert-escalation.service';
import {
  createMockEvent,
  createMockAlertEscalationConfig,
} from '../../../test-helpers';
import { EventStatus } from '../../../events/domain/entities/event.entity';
import { AlertLevel } from '../../domain/entities/alert-escalation-message.entity';
import type { Event } from '../../../events/domain/entities/event.entity';
import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';

describe('AlertCronService', () => {
  let service: AlertCronService;
  let eventRepository: jest.Mocked<TypeOrmEventRepository>;
  let alertEscalationService: jest.Mocked<AlertEscalationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertCronService,
        {
          // Por defecto, sin paros programados: los minutos productivos son
          // iguales a los de reloj, preservando el comportamiento previo.
          provide: ScheduledDowntimeCalculatorService,
          useValue: {
            getEffectiveSeconds: jest
              .fn()
              .mockImplementation((_areaId: number, start: Date, end: Date) =>
                Promise.resolve(
                  Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
                )
              ),
          },
        },
        {
          provide: TypeOrmEventRepository,
          useValue: {
            findOpenEvents: jest.fn(),
          },
        },
        {
          provide: AlertEscalationService,
          useValue: {
            findConfigByDeviceAndSignal: jest.fn(),
            determineLevelToSend: jest.fn(),
            sendAlertForLevel: jest.fn(),
            sendCloseEventAlert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertCronService>(AlertCronService);
    eventRepository = module.get(TypeOrmEventRepository);
    alertEscalationService = module.get(AlertEscalationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processOpenEvents', () => {
    it('should process all open events', async () => {
      const openEvents = [
        createMockEvent({ id: 1, status: EventStatus.OPEN }),
        createMockEvent({ id: 2, status: EventStatus.OPEN }),
      ];
      const mockConfig = createMockAlertEscalationConfig({ id: 1 });

      eventRepository.findOpenEvents.mockResolvedValue(openEvents);
      alertEscalationService.findConfigByDeviceAndSignal.mockResolvedValue(
        mockConfig
      );
      alertEscalationService.determineLevelToSend.mockReturnValue(
        AlertLevel.WARNING
      );
      alertEscalationService.sendAlertForLevel.mockResolvedValue(undefined);

      await service.processOpenEvents();

      expect(eventRepository.findOpenEvents).toHaveBeenCalled();
      expect(
        alertEscalationService.findConfigByDeviceAndSignal
      ).toHaveBeenCalledTimes(2);
    });

    it('should skip events without config', async () => {
      const openEvents = [createMockEvent({ id: 1, status: EventStatus.OPEN })];

      eventRepository.findOpenEvents.mockResolvedValue(openEvents);
      alertEscalationService.findConfigByDeviceAndSignal.mockResolvedValue(
        null
      );

      await service.processOpenEvents();

      expect(
        alertEscalationService.determineLevelToSend
      ).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      eventRepository.findOpenEvents.mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.processOpenEvents()).resolves.not.toThrow();
    });
  });

  describe('processEventEscalation', () => {
    it('should process event escalation when config exists', async () => {
      const event = createMockEvent({
        id: 1,
        status: EventStatus.OPEN,
        createdAt: new Date(Date.now() - 50 * 60 * 1000),
      });
      const mockConfig = createMockAlertEscalationConfig({
        id: 1,
        deviceId: event.deviceId,
        deviceSignalId: event.deviceSignalId,
      });

      alertEscalationService.findConfigByDeviceAndSignal.mockResolvedValue(
        mockConfig
      );
      alertEscalationService.determineLevelToSend.mockReturnValue(
        AlertLevel.WARNING
      );
      alertEscalationService.sendAlertForLevel.mockResolvedValue(undefined);

      await (
        service as unknown as {
          processEventEscalation: (event: Event) => Promise<void>;
        }
      ).processEventEscalation(event);

      expect(
        alertEscalationService.findConfigByDeviceAndSignal
      ).toHaveBeenCalledWith(event.deviceId, event.deviceSignalId);
      expect(alertEscalationService.determineLevelToSend).toHaveBeenCalled();
      expect(alertEscalationService.sendAlertForLevel).toHaveBeenCalledWith(
        event,
        mockConfig,
        AlertLevel.WARNING
      );
    });

    it('should skip when no config exists', async () => {
      const event = createMockEvent({ id: 1 });

      alertEscalationService.findConfigByDeviceAndSignal.mockResolvedValue(
        null
      );

      await (
        service as unknown as {
          processEventEscalation: (event: Event) => Promise<void>;
        }
      ).processEventEscalation(event);

      expect(
        alertEscalationService.determineLevelToSend
      ).not.toHaveBeenCalled();
    });

    it('should skip when no level to send', async () => {
      const event = createMockEvent({
        id: 1,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      });
      const mockConfig = createMockAlertEscalationConfig({ id: 1 });

      alertEscalationService.findConfigByDeviceAndSignal.mockResolvedValue(
        mockConfig
      );
      alertEscalationService.determineLevelToSend.mockReturnValue(null);

      await (
        service as unknown as {
          processEventEscalation: (event: Event) => Promise<void>;
        }
      ).processEventEscalation(event);

      expect(alertEscalationService.sendAlertForLevel).not.toHaveBeenCalled();
    });
  });

  describe('processClosedEvent', () => {
    it('should process closed event successfully', async () => {
      const event = createMockEvent({
        id: 1,
        status: EventStatus.CLOSED,
      });
      const mockConfig = createMockAlertEscalationConfig({
        id: 1,
        deviceId: event.deviceId,
        deviceSignalId: event.deviceSignalId,
      });

      alertEscalationService.findConfigByDeviceAndSignal.mockResolvedValue(
        mockConfig
      );
      alertEscalationService.sendCloseEventAlert.mockResolvedValue(undefined);

      await service.processClosedEvent(event);

      expect(
        alertEscalationService.findConfigByDeviceAndSignal
      ).toHaveBeenCalledWith(event.deviceId, event.deviceSignalId);
      expect(alertEscalationService.sendCloseEventAlert).toHaveBeenCalledWith(
        event,
        mockConfig
      );
    });

    it('should skip when no config exists', async () => {
      const event = createMockEvent({
        id: 1,
        status: EventStatus.CLOSED,
      });

      alertEscalationService.findConfigByDeviceAndSignal.mockResolvedValue(
        null
      );

      await service.processClosedEvent(event);

      expect(alertEscalationService.sendCloseEventAlert).not.toHaveBeenCalled();
    });
  });
});

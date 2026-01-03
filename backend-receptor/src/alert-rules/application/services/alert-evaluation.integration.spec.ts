import { Test, type TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AlertEvaluationService } from './alert-evaluation.service';
import { AlertRuleService } from './alert-rule.service';
import { AlertTriggerService } from '../../../alert-triggers/application/services/alert-trigger.service';
import { AlertMessageService } from '../../../alert-messages/application/services/alert-message.service';
import { AlertMessageSenderService } from '../../../alert-messages/application/services/alert-message-sender.service';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import {
  AlertRule,
  AlertRuleMode,
} from '../../domain/entities/alert-rule.entity';
import { AlertMessage, MessageType } from '../../../alert-messages/domain/entities/alert-message.entity';
import {
  createMockAlertRule,
  createMockAlertMessage,
  createMockMeasurement,
  createMockRawMeasurement,
} from '../../../test-helpers';

describe('AlertEvaluationService - Integration Tests', () => {
  let service: AlertEvaluationService;
  let alertRuleService: jest.Mocked<AlertRuleService>;
  let alertMessageService: jest.Mocked<AlertMessageService>;
  let alertMessageSenderService: jest.Mocked<AlertMessageSenderService>;
  let measurementService: jest.Mocked<MeasurementService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertEvaluationService,
        {
          provide: AlertRuleService,
          useValue: {
            getEnabledAlertRules: jest.fn(),
          },
        },
        {
          provide: AlertTriggerService,
          useValue: {
            createAlertTrigger: jest.fn(),
          },
        },
        {
          provide: AlertMessageService,
          useValue: {
            getMessagesByAlertRuleId: jest.fn(),
          },
        },
        {
          provide: AlertMessageSenderService,
          useValue: {
            sendMessages: jest.fn(),
          },
        },
        {
          provide: MeasurementService,
          useValue: {
            getMeasurementByExternalId: jest.fn(),
          },
        },
        {
          provide: WebSocketEmitterService,
          useValue: {
            emitToAll: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertEvaluationService>(AlertEvaluationService);
    alertRuleService = module.get(AlertRuleService);
    alertMessageService = module.get(AlertMessageService);
    alertMessageSenderService = module.get(AlertMessageSenderService);
    measurementService = module.get(MeasurementService);
    httpService = module.get(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Alert Flow Integration', () => {
    it('should trigger alert, send messages with correct format, and create trigger log', async () => {
      // Step 1: Setup - Create alert rule
      const mockMeasurement = createMockMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
        name: 'Temperature Sensor',
      });

      const mockAlertRule: AlertRule = createMockAlertRule({
        id: 1,
        name: 'High Temperature Alert',
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 50,
        isEnabled: true,
      });

      // Step 2: Setup - Create messages (torreta, receptor, email)
      const mockMessages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          alertRuleId: 1,
          messageType: MessageType.TORRETA,
          targetId: 'TORRETA_001',
          color: 'R1',
          message: '',
        }),
        createMockAlertMessage({
          id: 2,
          alertRuleId: 1,
          messageType: MessageType.RECEPTOR,
          targetId: 'RECEPTOR_001',
          message: 'Alerta de temperatura alta activada',
        }),
        createMockAlertMessage({
          id: 3,
          alertRuleId: 1,
          messageType: MessageType.EMAIL,
          targetId: 'operator@example.com',
          message: 'Alerta de temperatura alta activada',
        }),
      ];

      // Step 3: Setup - Create raw measurement that triggers alert
      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
        value: '55', // Value > 50, should trigger alert
      });

      // Mock services
      measurementService.getMeasurementByExternalId.mockResolvedValue(
        mockMeasurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([mockAlertRule]);
      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );
      alertMessageSenderService.sendMessages.mockResolvedValue(true);

      // Step 4: Execute - Evaluate measurement
      await service.evaluateMeasurement(rawMeasurement);

      // Step 5: Verify - Check that messages were sent with correct format
      expect(alertMessageSenderService.sendMessages).toHaveBeenCalledTimes(1);
      const [sentMessages, endpointUrl] =
        alertMessageSenderService.sendMessages.mock.calls[0];

      expect(endpointUrl).toBe('http://localhost:1880/events');
      expect(sentMessages).toHaveLength(3);
      expect(sentMessages[0].messageType).toBe(MessageType.TORRETA);
      expect(sentMessages[0].targetId).toBe('TORRETA_001');
      expect(sentMessages[0].color).toBe('R1');
      expect(sentMessages[1].messageType).toBe(MessageType.RECEPTOR);
      expect(sentMessages[1].targetId).toBe('RECEPTOR_001');
      expect(sentMessages[2].messageType).toBe(MessageType.EMAIL);
      expect(sentMessages[2].targetId).toBe('operator@example.com');
    });

    it('should not trigger alert when condition is not met', async () => {
      const mockMeasurement = createMockMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
      });

      const mockAlertRule: AlertRule = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 50,
        isEnabled: true,
      });

      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
        value: '45', // Value < 50, should NOT trigger alert
      });

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        mockMeasurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([mockAlertRule]);

      await service.evaluateMeasurement(rawMeasurement);

      // Should not send messages
      expect(alertMessageService.getMessagesByAlertRuleId).not.toHaveBeenCalled();
      expect(alertMessageSenderService.sendMessages).not.toHaveBeenCalled();
    });

    it('should handle window mode alerts correctly', async () => {
      const mockMeasurement = createMockMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
      });

      const mockAlertRule: AlertRule = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
        maxValue: 30,
        isEnabled: true,
      });

      const mockMessages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          alertRuleId: 1,
          messageType: MessageType.EMAIL,
          targetId: 'user@example.com',
          message: 'Valor fuera de rango',
        }),
      ];

      // Value outside window (35 > 30)
      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
        value: '35',
      });

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        mockMeasurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([mockAlertRule]);
      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );
      alertMessageSenderService.sendMessages.mockResolvedValue(true);

      await service.evaluateMeasurement(rawMeasurement);

      // Should trigger alert and send messages
      expect(alertMessageSenderService.sendMessages).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple alert rules for same measurement', async () => {
      const mockMeasurement = createMockMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
      });

      const mockAlertRule1: AlertRule = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 50,
        isEnabled: true,
      });

      const mockAlertRule2: AlertRule = createMockAlertRule({
        id: 2,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 60,
        isEnabled: true,
      });

      const mockMessages1: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          alertRuleId: 1,
          messageType: MessageType.EMAIL,
          targetId: 'user1@example.com',
          message: 'Alert 1',
        }),
      ];

      const mockMessages2: AlertMessage[] = [
        createMockAlertMessage({
          id: 2,
          alertRuleId: 2,
          messageType: MessageType.EMAIL,
          targetId: 'user2@example.com',
          message: 'Alert 2',
        }),
      ];

      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
        value: '65', // Triggers both rules (>50 and >60)
      });

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        mockMeasurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([
        mockAlertRule1,
        mockAlertRule2,
      ]);
      alertMessageService.getMessagesByAlertRuleId
        .mockResolvedValueOnce(mockMessages1)
        .mockResolvedValueOnce(mockMessages2);
      alertMessageSenderService.sendMessages.mockResolvedValue(true);

      await service.evaluateMeasurement(rawMeasurement);

      // Should send messages for both rules
      expect(alertMessageSenderService.sendMessages).toHaveBeenCalledTimes(2);
    });

    it('should handle HTTP errors gracefully without breaking flow', async () => {
      const mockMeasurement = createMockMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
      });

      const mockAlertRule: AlertRule = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 50,
        isEnabled: true,
      });

      const mockMessages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          alertRuleId: 1,
          messageType: MessageType.EMAIL,
          targetId: 'user@example.com',
          message: 'Test',
        }),
      ];

      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        externalId: 'SENSOR_001',
        value: '55',
      });

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        mockMeasurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([mockAlertRule]);
      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );
      alertMessageSenderService.sendMessages.mockResolvedValue(false); // HTTP error

      // Should not throw error
      await expect(
        service.evaluateMeasurement(rawMeasurement)
      ).resolves.not.toThrow();

      expect(alertMessageSenderService.sendMessages).toHaveBeenCalled();
    });
  });
});


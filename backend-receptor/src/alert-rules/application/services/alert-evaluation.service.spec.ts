import { Test, type TestingModule } from '@nestjs/testing';
import { AlertEvaluationService } from './alert-evaluation.service';
import { AlertRuleService } from './alert-rule.service';
import { AlertTriggerService } from '../../../alert-triggers/application/services/alert-trigger.service';
import { AlertMessageService } from '../../../alert-messages/application/services/alert-message.service';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import {
  createMockAlertRule,
  createMockMeasurement,
  createMockRawMeasurement,
} from '../../../test-helpers';
import { AlertRuleMode } from '../../domain/entities/alert-rule.entity';
import {
  type AlertMessage,
  ReceptorType,
} from '../../../alert-messages/domain/entities/alert-message.entity';

describe('AlertEvaluationService', () => {
  let service: AlertEvaluationService;
  let alertRuleService: jest.Mocked<AlertRuleService>;
  let alertTriggerService: jest.Mocked<AlertTriggerService>;
  let alertMessageService: jest.Mocked<AlertMessageService>;
  let measurementService: jest.Mocked<MeasurementService>;
  let webSocketEmitterService: jest.Mocked<WebSocketEmitterService>;

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
      ],
    }).compile();

    service = module.get<AlertEvaluationService>(AlertEvaluationService);
    alertRuleService = module.get(AlertRuleService);
    alertTriggerService = module.get(AlertTriggerService);
    alertMessageService = module.get(AlertMessageService);
    measurementService = module.get(MeasurementService);
    webSocketEmitterService = module.get(WebSocketEmitterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateMeasurement', () => {
    it('should evaluate rules when Measurement exists', async () => {
      // Arrange
      const rawMeasurement = createMockRawMeasurement({
        externalId: 'MEAS001',
        value: '30',
      });
      const measurement = createMockMeasurement({
        id: 1,
        externalId: 'MEAS001',
      });
      const mockRule = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });
      const mockMessages: AlertMessage[] = [];

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        measurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([mockRule]);
      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service.evaluateMeasurement(rawMeasurement);

      // Assert
      expect(
        measurementService.getMeasurementByExternalId
      ).toHaveBeenCalledWith('MEAS001');
      expect(alertRuleService.getEnabledAlertRules).toHaveBeenCalled();
    });

    it('should filter rules by measurementId correctly', async () => {
      // Arrange
      const rawMeasurement = createMockRawMeasurement({
        externalId: 'MEAS001',
        value: '30',
      });
      const measurement = createMockMeasurement({
        id: 1,
        externalId: 'MEAS001',
      });
      const ruleForMeasurement = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });
      const ruleForOtherMeasurement = createMockAlertRule({
        id: 2,
        measurementId: 2,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });
      const mockMessages: AlertMessage[] = [];

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        measurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([
        ruleForMeasurement,
        ruleForOtherMeasurement,
      ]);
      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service.evaluateMeasurement(rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalledTimes(1);
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          alertRuleId: 1,
        })
      );
    });

    it('should evaluate multiple rules for same Measurement', async () => {
      // Arrange
      const rawMeasurement = createMockRawMeasurement({
        externalId: 'MEAS001',
        value: '30',
      });
      const measurement = createMockMeasurement({
        id: 1,
        externalId: 'MEAS001',
      });
      const rule1 = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });
      const rule2 = createMockAlertRule({
        id: 2,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '<',
        setpoint: 35,
      });
      const mockMessages: AlertMessage[] = [];

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        measurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([rule1, rule2]);
      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service.evaluateMeasurement(rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalledTimes(2);
    });

    it('should call handleTriggeredAlert when condition is met', async () => {
      // Arrange
      const rawMeasurement = createMockRawMeasurement({
        externalId: 'MEAS001',
        value: '30',
      });
      const measurement = createMockMeasurement({
        id: 1,
        externalId: 'MEAS001',
      });
      const mockRule = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });
      const mockMessages: AlertMessage[] = [];

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        measurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([mockRule]);
      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service.evaluateMeasurement(rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalled();
      expect(webSocketEmitterService.emitToAll).toHaveBeenCalled();
    });

    it('should not trigger when condition is not met', async () => {
      // Arrange
      const rawMeasurement = createMockRawMeasurement({
        externalId: 'MEAS001',
        value: '20',
      });
      const measurement = createMockMeasurement({
        id: 1,
        externalId: 'MEAS001',
      });
      const mockRule = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        measurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([mockRule]);

      // Act
      await service.evaluateMeasurement(rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).not.toHaveBeenCalled();
      expect(webSocketEmitterService.emitToAll).not.toHaveBeenCalled();
    });

    it('should return early when Measurement does not exist', async () => {
      // Arrange
      const rawMeasurement = createMockRawMeasurement({
        externalId: 'NONEXISTENT',
        value: '30',
      });

      measurementService.getMeasurementByExternalId.mockResolvedValue(null);

      // Act
      await service.evaluateMeasurement(rawMeasurement);

      // Assert
      expect(alertRuleService.getEnabledAlertRules).not.toHaveBeenCalled();
      expect(alertTriggerService.createAlertTrigger).not.toHaveBeenCalled();
    });

    it('should return early when no rules for Measurement', async () => {
      // Arrange
      const rawMeasurement = createMockRawMeasurement({
        externalId: 'MEAS001',
        value: '30',
      });
      const measurement = createMockMeasurement({
        id: 1,
        externalId: 'MEAS001',
      });

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        measurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([]);

      // Act
      await service.evaluateMeasurement(rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).not.toHaveBeenCalled();
    });

    it('should continue evaluating other rules if one fails', async () => {
      // Arrange
      const rawMeasurement = createMockRawMeasurement({
        externalId: 'MEAS001',
        value: '30',
      });
      const measurement = createMockMeasurement({
        id: 1,
        externalId: 'MEAS001',
      });
      const rule1 = createMockAlertRule({
        id: 1,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });
      const rule2 = createMockAlertRule({
        id: 2,
        measurementId: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });

      measurementService.getMeasurementByExternalId.mockResolvedValue(
        measurement
      );
      alertRuleService.getEnabledAlertRules.mockResolvedValue([rule1, rule2]);
      alertMessageService.getMessagesByAlertRuleId
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Message service error'));

      // Act
      await service.evaluateMeasurement(rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalledTimes(1);
    });
  });

  describe('evaluateCondition', () => {
    it('should return false when valueStr is not numeric', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });

      // Act
      const result = service['evaluateCondition'](rule, 'not-a-number');

      // Assert
      expect(result).toBe(false);
    });

    it('should call evaluateSetpoint when mode is SETPOINT', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });

      // Act
      const result = service['evaluateCondition'](rule, '30');

      // Assert
      expect(result).toBe(true);
    });

    it('should call evaluateWindow when mode is WINDOW', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
        maxValue: 30,
      });

      // Act
      const result = service['evaluateCondition'](rule, '35');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when mode is unknown', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: 'unknown' as AlertRuleMode,
      });

      // Act
      const result = service['evaluateCondition'](rule, '30');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('evaluateSetpoint', () => {
    describe('operator >', () => {
      it('should return true when value > setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '>',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](30, rule);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when value <= setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '>',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](20, rule);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('operator >=', () => {
      it('should return true when value >= setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '>=',
          setpoint: 25,
        });

        // Act
        const result1 = service['evaluateSetpoint'](25, rule);
        const result2 = service['evaluateSetpoint'](30, rule);

        // Assert
        expect(result1).toBe(true);
        expect(result2).toBe(true);
      });

      it('should return false when value < setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '>=',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](20, rule);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('operator <', () => {
      it('should return true when value < setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '<',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](20, rule);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when value >= setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '<',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](25, rule);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('operator <=', () => {
      it('should return true when value <= setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '<=',
          setpoint: 25,
        });

        // Act
        const result1 = service['evaluateSetpoint'](25, rule);
        const result2 = service['evaluateSetpoint'](20, rule);

        // Assert
        expect(result1).toBe(true);
        expect(result2).toBe(true);
      });

      it('should return false when value > setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '<=',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](30, rule);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('operator ==', () => {
      it('should return true when value === setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '==',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](25, rule);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when value !== setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '==',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](30, rule);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe('operator !=', () => {
      it('should return true when value !== setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '!=',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](30, rule);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false when value === setpoint', () => {
        // Arrange
        const rule = createMockAlertRule({
          operator: '!=',
          setpoint: 25,
        });

        // Act
        const result = service['evaluateSetpoint'](25, rule);

        // Assert
        expect(result).toBe(false);
      });
    });

    it('should return false when operator is undefined', () => {
      // Arrange
      const rule = createMockAlertRule({
        operator: undefined,
        setpoint: 25,
      });

      // Act
      const result = service['evaluateSetpoint'](30, rule);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when setpoint is undefined', () => {
      // Arrange
      const rule = createMockAlertRule({
        operator: '>',
        setpoint: undefined,
      });

      // Act
      const result = service['evaluateSetpoint'](30, rule);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when operator is invalid', () => {
      // Arrange
      const rule = createMockAlertRule({
        operator: 'invalid',
        setpoint: 25,
      });

      // Act
      const result = service['evaluateSetpoint'](30, rule);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('evaluateWindow', () => {
    it('should return true when value < minValue', () => {
      // Arrange
      const rule = createMockAlertRule({
        minValue: 20,
        maxValue: 30,
      });

      // Act
      const result = service['evaluateWindow'](15, rule);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when value > maxValue', () => {
      // Arrange
      const rule = createMockAlertRule({
        minValue: 20,
        maxValue: 30,
      });

      // Act
      const result = service['evaluateWindow'](35, rule);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when minValue <= value <= maxValue', () => {
      // Arrange
      const rule = createMockAlertRule({
        minValue: 20,
        maxValue: 30,
      });

      // Act
      const result = service['evaluateWindow'](25, rule);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when value === minValue', () => {
      // Arrange
      const rule = createMockAlertRule({
        minValue: 20,
        maxValue: 30,
      });

      // Act
      const result = service['evaluateWindow'](20, rule);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when value === maxValue', () => {
      // Arrange
      const rule = createMockAlertRule({
        minValue: 20,
        maxValue: 30,
      });

      // Act
      const result = service['evaluateWindow'](30, rule);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when minValue is undefined', () => {
      // Arrange
      const rule = createMockAlertRule({
        minValue: undefined,
        maxValue: 30,
      });

      // Act
      const result = service['evaluateWindow'](15, rule);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when maxValue is undefined', () => {
      // Arrange
      const rule = createMockAlertRule({
        minValue: 20,
        maxValue: undefined,
      });

      // Act
      const result = service['evaluateWindow'](35, rule);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('handleTriggeredAlert', () => {
    it('should build conditionResult correctly for SETPOINT', async () => {
      // Arrange
      const rule = createMockAlertRule({
        id: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });
      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        value: '30',
      });
      const mockMessages: AlertMessage[] = [];

      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service['handleTriggeredAlert'](rule, rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          conditionResult: '30 > 25 = true',
        })
      );
    });

    it('should build conditionResult correctly for WINDOW below minimum', async () => {
      // Arrange
      const rule = createMockAlertRule({
        id: 1,
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
        maxValue: 30,
      });
      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        value: '15',
      });
      const mockMessages: AlertMessage[] = [];

      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service['handleTriggeredAlert'](rule, rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          conditionResult: '15 < 20 (below minimum)',
        })
      );
    });

    it('should build conditionResult correctly for WINDOW above maximum', async () => {
      // Arrange
      const rule = createMockAlertRule({
        id: 1,
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
        maxValue: 30,
      });
      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        value: '35',
      });
      const mockMessages: AlertMessage[] = [];

      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service['handleTriggeredAlert'](rule, rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          conditionResult: '35 > 30 (above maximum)',
        })
      );
    });

    it('should get messages associated with rule', async () => {
      // Arrange
      const rule = createMockAlertRule({ id: 1 });
      const rawMeasurement = createMockRawMeasurement({ id: 1, value: '30' });
      const mockMessages: AlertMessage[] = [
        {
          id: 1,
          alertRuleId: 1,
          receptorType: ReceptorType.TELEGRAM,
          messageData: {},
          messageGroupId: 1,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AlertMessage,
      ];

      // Mock getAlertRuleById since getMessagesByAlertRuleId calls it
      alertRuleService.getAlertRuleById = jest.fn().mockResolvedValue(rule);
      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service['handleTriggeredAlert'](rule, rawMeasurement);

      // Assert
      expect(alertMessageService.getMessagesByAlertRuleId).toHaveBeenCalledWith(
        1
      );
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          messagesTriggered: [1],
        })
      );
    });

    it('should create AlertTrigger with correct data', async () => {
      // Arrange
      const rule = createMockAlertRule({
        id: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });
      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        value: '30',
      });
      const mockMessages: AlertMessage[] = [];

      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service['handleTriggeredAlert'](rule, rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalledWith({
        alertRuleId: 1,
        rawMeasurementId: 1,
        measurementValue: 30,
        conditionResult: '30 > 25 = true',
        messagesTriggered: [],
      });
    });

    it('should emit WebSocket event alert_triggered', async () => {
      // Arrange
      const rule = createMockAlertRule({
        id: 1,
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });
      const rawMeasurement = createMockRawMeasurement({
        id: 1,
        value: '30',
      });
      const mockMessages: AlertMessage[] = [];

      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );

      // Act
      await service['handleTriggeredAlert'](rule, rawMeasurement);

      // Assert
      expect(webSocketEmitterService.emitToAll).toHaveBeenCalledWith(
        'alert_triggered',
        expect.objectContaining({
          type: 'alert',
          data: expect.objectContaining({
            alertRule: rule,
            value: 30,
            conditionResult: '30 > 25 = true',
            messagesCount: 0,
          }),
        })
      );
    });

    it('should continue when AlertTrigger creation fails', async () => {
      // Arrange
      const rule = createMockAlertRule({ id: 1 });
      const rawMeasurement = createMockRawMeasurement({ id: 1, value: '30' });
      const mockMessages: AlertMessage[] = [];

      alertMessageService.getMessagesByAlertRuleId.mockResolvedValue(
        mockMessages
      );
      alertTriggerService.createAlertTrigger.mockRejectedValue(
        new Error('Trigger error')
      );

      // Act
      await service['handleTriggeredAlert'](rule, rawMeasurement);

      // Assert
      expect(alertTriggerService.createAlertTrigger).toHaveBeenCalled();
    });
  });

  describe('buildConditionResult', () => {
    it('should build string correctly for operator >', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.SETPOINT,
        operator: '>',
        setpoint: 25,
      });

      // Act
      const result = service['buildConditionResult'](rule, 30);

      // Assert
      expect(result).toBe('30 > 25 = true');
    });

    it('should build string correctly for operator >=', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.SETPOINT,
        operator: '>=',
        setpoint: 25,
      });

      // Act
      const result = service['buildConditionResult'](rule, 25);

      // Assert
      expect(result).toBe('25 >= 25 = true');
    });

    it('should build string correctly for operator <', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.SETPOINT,
        operator: '<',
        setpoint: 25,
      });

      // Act
      const result = service['buildConditionResult'](rule, 20);

      // Assert
      expect(result).toBe('20 < 25 = true');
    });

    it('should build string correctly for operator <=', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.SETPOINT,
        operator: '<=',
        setpoint: 25,
      });

      // Act
      const result = service['buildConditionResult'](rule, 25);

      // Assert
      expect(result).toBe('25 <= 25 = true');
    });

    it('should build string correctly for operator ==', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.SETPOINT,
        operator: '==',
        setpoint: 25,
      });

      // Act
      const result = service['buildConditionResult'](rule, 25);

      // Assert
      expect(result).toBe('25 == 25 = true');
    });

    it('should build string correctly for operator !=', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.SETPOINT,
        operator: '!=',
        setpoint: 25,
      });

      // Act
      const result = service['buildConditionResult'](rule, 30);

      // Assert
      expect(result).toBe('30 != 25 = true');
    });

    it('should build string correctly for WINDOW below minimum', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
        maxValue: 30,
      });

      // Act
      const result = service['buildConditionResult'](rule, 15);

      // Assert
      expect(result).toBe('15 < 20 (below minimum)');
    });

    it('should build string correctly for WINDOW above maximum', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: AlertRuleMode.WINDOW,
        minValue: 20,
        maxValue: 30,
      });

      // Act
      const result = service['buildConditionResult'](rule, 35);

      // Assert
      expect(result).toBe('35 > 30 (above maximum)');
    });

    it('should build generic string for unknown mode', () => {
      // Arrange
      const rule = createMockAlertRule({
        mode: 'unknown' as AlertRuleMode,
      });

      // Act
      const result = service['buildConditionResult'](rule, 30);

      // Assert
      expect(result).toBe('30 triggered condition');
    });
  });

  describe('triggerNotifications', () => {
    it('should handle ReceptorType.TELEGRAM', () => {
      // Arrange
      const rule = createMockAlertRule();
      const messages: AlertMessage[] = [
        {
          id: 1,
          alertRuleId: 1,
          receptorType: ReceptorType.TELEGRAM,
          messageData: {},
          messageGroupId: 1,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AlertMessage,
      ];

      // Act
      service['triggerNotifications'](rule, messages);

      // Assert
      // No error should be thrown
    });

    it('should handle ReceptorType.TORRETA', () => {
      // Arrange
      const rule = createMockAlertRule();
      const messages: AlertMessage[] = [
        {
          id: 1,
          alertRuleId: 1,
          receptorType: ReceptorType.TORRETA,
          messageData: {},
          messageGroupId: 1,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AlertMessage,
      ];

      // Act
      service['triggerNotifications'](rule, messages);

      // Assert
      // No error should be thrown
    });

    it('should handle ReceptorType.CORREO', () => {
      // Arrange
      const rule = createMockAlertRule();
      const messages: AlertMessage[] = [
        {
          id: 1,
          alertRuleId: 1,
          receptorType: ReceptorType.CORREO,
          messageData: {},
          messageGroupId: 1,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AlertMessage,
      ];

      // Act
      service['triggerNotifications'](rule, messages);

      // Assert
      // No error should be thrown
    });

    it('should handle ReceptorType.RECEPTOR', () => {
      // Arrange
      const rule = createMockAlertRule();
      const messages: AlertMessage[] = [
        {
          id: 1,
          alertRuleId: 1,
          receptorType: ReceptorType.RECEPTOR,
          messageData: {},
          messageGroupId: 1,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AlertMessage,
      ];

      // Act
      service['triggerNotifications'](rule, messages);

      // Assert
      // No error should be thrown
    });

    it('should log warning for unknown receptor type', () => {
      // Arrange
      const rule = createMockAlertRule();
      const messages: AlertMessage[] = [
        {
          id: 1,
          alertRuleId: 1,
          receptorType: 'unknown' as ReceptorType,
          messageData: {},
          messageGroupId: 1,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AlertMessage,
      ];

      // Act
      service['triggerNotifications'](rule, messages);

      // Assert
      // Warning should be logged (tested via logger spy if needed)
    });

    it('should process multiple messages correctly', () => {
      // Arrange
      const rule = createMockAlertRule();
      const messages: AlertMessage[] = [
        {
          id: 1,
          alertRuleId: 1,
          receptorType: ReceptorType.TELEGRAM,
          messageData: {},
          messageGroupId: 1,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AlertMessage,
        {
          id: 2,
          alertRuleId: 1,
          receptorType: ReceptorType.CORREO,
          messageData: {},
          messageGroupId: 1,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as AlertMessage,
      ];

      // Act
      service['triggerNotifications'](rule, messages);

      // Assert
      // No error should be thrown
    });
  });
});

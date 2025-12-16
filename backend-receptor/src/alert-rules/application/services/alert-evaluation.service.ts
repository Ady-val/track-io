import { Injectable, Logger } from '@nestjs/common';
import { AlertRuleService } from './alert-rule.service';
import { AlertTriggerService } from '../../../alert-triggers/application/services/alert-trigger.service';
import { AlertMessageService } from '../../../alert-messages/application/services/alert-message.service';
import { MeasurementService } from '../../../measurements/application/services/measurement.service';
import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
import { RawMeasurement } from '../../../raw-measurements/domain/entities/raw-measurement.entity';
import { Measurement } from '../../../measurements/domain/entities/measurement.entity';
import {
  AlertMessage,
  ReceptorType,
} from '../../../alert-messages/domain/entities/alert-message.entity';
import {
  AlertRule,
  AlertRuleMode,
} from '../../domain/entities/alert-rule.entity';

@Injectable()
export class AlertEvaluationService {
  private readonly logger = new Logger(AlertEvaluationService.name);

  constructor(
    private readonly alertRuleService: AlertRuleService,
    private readonly alertTriggerService: AlertTriggerService,
    private readonly alertMessageService: AlertMessageService,
    private readonly measurementService: MeasurementService,
    private readonly webSocketEmitterService: WebSocketEmitterService
  ) {}

  async evaluateMeasurement(rawMeasurement: RawMeasurement): Promise<void> {
    try {
      const measurement = await this.getMeasurement(rawMeasurement.externalId);

      if (!measurement) {
        return;
      }

      const allActiveRules = await this.alertRuleService.getEnabledAlertRules();

      const rulesForMeasurement = allActiveRules.filter(
        r => r.measurementId === measurement.id
      );

      if (rulesForMeasurement.length === 0) {
        return;
      }

      for (const rule of rulesForMeasurement) {
        const triggered = this.evaluateCondition(rule, rawMeasurement.value);

        if (triggered) {
          await this.handleTriggeredAlert(rule, rawMeasurement);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error evaluating measurement: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private async getMeasurement(
    externalId: string
  ): Promise<Measurement | null> {
    try {
      return await this.measurementService.getMeasurementByExternalId(
        externalId
      );
    } catch {
      return null;
    }
  }

  private evaluateCondition(rule: AlertRule, valueStr: string): boolean {
    const value = parseFloat(valueStr);

    if (isNaN(value)) {
      this.logger.warn(`Invalid numeric value: ${valueStr}`);
      return false;
    }

    switch (rule.mode) {
      case AlertRuleMode.SETPOINT:
        return this.evaluateSetpoint(value, rule);
      case AlertRuleMode.WINDOW:
        return this.evaluateWindow(value, rule);
      default:
        return false;
    }
  }

  private evaluateSetpoint(value: number, rule: AlertRule): boolean {
    if (!rule.operator || rule.setpoint === undefined) {
      return false;
    }

    const setpoint = Number(rule.setpoint);

    switch (rule.operator) {
      case '>':
        return value > setpoint;
      case '>=':
        return value >= setpoint;
      case '<':
        return value < setpoint;
      case '<=':
        return value <= setpoint;
      case '==':
        return value === setpoint;
      case '!=':
        return value !== setpoint;
      default:
        return false;
    }
  }

  private evaluateWindow(value: number, rule: AlertRule): boolean {
    if (rule.minValue === undefined || rule.maxValue === undefined) {
      return false;
    }

    const minValue = Number(rule.minValue);
    const maxValue = Number(rule.maxValue);

    return value < minValue || value > maxValue;
  }

  private async handleTriggeredAlert(
    rule: AlertRule,
    rawMeasurement: RawMeasurement
  ): Promise<void> {
    const value = parseFloat(rawMeasurement.value);

    const conditionResult = this.buildConditionResult(rule, value);

    try {
      const messages = await this.alertMessageService.getMessagesByAlertRuleId(
        rule.id
      );

      const messageIds = messages.map(m => m.id);

      await this.alertTriggerService.createAlertTrigger({
        alertRuleId: rule.id,
        rawMeasurementId: rawMeasurement.id,
        measurementValue: value,
        conditionResult,
        messagesTriggered: messageIds,
      });

      this.triggerNotifications(rule, messages);

      this.webSocketEmitterService.emitToAll('alert_triggered', {
        type: 'alert',
        data: {
          alertRule: rule,
          value,
          conditionResult,
          messagesCount: messages.length,
          triggeredAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Error handling triggered alert: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private buildConditionResult(rule: AlertRule, value: number): string {
    switch (rule.mode) {
      case AlertRuleMode.SETPOINT:
        return `${value} ${rule.operator} ${rule.setpoint} = true`;

      case AlertRuleMode.WINDOW:
        if (value < Number(rule.minValue)) {
          return `${value} < ${rule.minValue} (below minimum)`;
        }
        if (value > Number(rule.maxValue)) {
          return `${value} > ${rule.maxValue} (above maximum)`;
        }
        return `${value} triggered window condition`;

      default:
        return `${value} triggered condition`;
    }
  }

  private triggerNotifications(
    _rule: AlertRule,
    messages: AlertMessage[]
  ): void {
    for (const message of messages) {
      const { receptorType } = message;

      switch (receptorType) {
        case ReceptorType.TELEGRAM:
          break;

        case ReceptorType.TORRETA:
          break;

        case ReceptorType.CORREO:
          break;

        case ReceptorType.RECEPTOR:
          break;

        default:
          this.logger.warn(`Unknown receptor type: ${String(receptorType)}`);
      }
    }
  }
}

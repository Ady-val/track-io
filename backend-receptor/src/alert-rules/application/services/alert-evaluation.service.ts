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
      // 1. Buscar measurement por externalId
      const measurement = await this.getMeasurement(rawMeasurement.externalId);

      // Guard clause: si no hay measurement, no evaluar
      if (!measurement) {
        return;
      }

      // 2. Obtener todas las AlertRules activas
      const allActiveRules = await this.alertRuleService.getEnabledAlertRules();

      // 3. Filtrar reglas para este measurement
      const rulesForMeasurement = allActiveRules.filter(
        r => r.measurementId === measurement.id
      );

      if (rulesForMeasurement.length === 0) {
        this.logger.debug(
          `No active alert rules for measurement ID: ${measurement.id}`
        );
        return;
      }

      this.logger.log(
        `Evaluating ${rulesForMeasurement.length} rules for measurement: ${measurement.name}`
      );

      // 4. Evaluar cada regla
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

  /**
   * Obtiene un measurement por su externalId
   * @returns Measurement si existe, null si no existe o hay error
   */
  private async getMeasurement(
    externalId: string
  ): Promise<Measurement | null> {
    try {
      return await this.measurementService.getMeasurementByExternalId(
        externalId
      );
    } catch (_error) {
      this.logger.debug(`No measurement found for externalId: ${externalId}`);
      return null;
    }
  }

  /**
   * Evalúa si una regla se cumple con un valor dado
   */
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

    this.logger.warn(`🚨 ALERT TRIGGERED: ${rule.name} - ${conditionResult}`);

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

      this.triggerNotifications(rule, messages, value);

      // Emitir evento WebSocket de alerta disparada
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

  /**
   * Construye descripción legible del resultado de la condición
   */
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

  /**
   * Dispara notificaciones según el tipo de mensaje
   */
  private triggerNotifications(
    rule: AlertRule,
    messages: AlertMessage[],
    value: number
  ): void {
    for (const message of messages) {
      const { receptorType, messageData } = message;

      this.logger.log(
        `📤 Triggering ${receptorType} notification for rule: ${rule.name}`
      );

      switch (receptorType) {
        case ReceptorType.TELEGRAM:
          // TODO: Implementar servicio de Telegram
          // eslint-disable-next-line no-console
          console.log('📱 TELEGRAM:', {
            title: messageData.telegram?.title,
            text: messageData.telegram?.text,
            value,
            ruleName: rule.name,
          });
          break;

        case ReceptorType.TORRETA:
          // TODO: Implementar servicio de control de torreta
          // eslint-disable-next-line no-console
          console.log('🚨 TORRETA:', {
            torretaId: messageData.torreta?.torretaId,
            colorId: messageData.torreta?.colorId,
            value,
            ruleName: rule.name,
          });
          break;

        case ReceptorType.CORREO:
          // TODO: Implementar servicio de envío de correo
          // eslint-disable-next-line no-console
          console.log('📧 CORREO:', {
            emails: messageData.correo?.emails,
            subject: messageData.correo?.subject,
            message: messageData.correo?.message,
            value,
            ruleName: rule.name,
          });
          break;

        case ReceptorType.RECEPTOR:
          // TODO: Implementar servicio de envío a receptor
          // eslint-disable-next-line no-console
          console.log('📟 RECEPTOR:', {
            receptorId: messageData.receptor?.receptorId,
            message: messageData.receptor?.message,
            value,
            ruleName: rule.name,
          });
          break;

        default:
          this.logger.warn(`Unknown receptor type: ${String(receptorType)}`);
      }
    }
  }
}

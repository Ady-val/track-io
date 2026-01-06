import { AlertMessage } from '../../domain/entities/alert-message.entity';
import type { CreateAlertMessageDto } from '../dtos/alert-message.dto';

export class AlertMessageFactory {
  static createFromDto(
    dto: CreateAlertMessageDto,
    alertRuleId: number
  ): AlertMessage {
    const alertMessage = new AlertMessage();
    alertMessage.alertRuleId = alertRuleId;
    alertMessage.messageType = dto.messageType;
    alertMessage.targetId = dto.targetId;
    alertMessage.message = dto.message || '';
    if (dto.color !== undefined) {
      alertMessage.color = dto.color;
    }
    alertMessage.messageGroupId = dto.messageGroupId;
    alertMessage.status = dto.status ?? 'pending';
    return alertMessage;
  }

  static createFromExisting(original: AlertMessage): AlertMessage {
    const duplicated = new AlertMessage();
    duplicated.alertRuleId = original.alertRuleId;
    duplicated.messageType = original.messageType;
    duplicated.targetId = original.targetId;
    duplicated.message = original.message;
    if (original.color !== undefined) {
      duplicated.color = original.color;
    }
    duplicated.messageGroupId = original.messageGroupId;
    duplicated.status = original.status;
    return duplicated;
  }
}

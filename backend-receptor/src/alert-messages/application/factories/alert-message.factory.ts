import {
  AlertMessage,
  type ReceptorType,
  type MessageData,
} from '../../domain/entities/alert-message.entity';
import type { CreateAlertMessageDto } from '../dtos/alert-message.dto';

export class AlertMessageFactory {
  static createFromDto(
    dto: CreateAlertMessageDto,
    alertRuleId: number
  ): AlertMessage {
    const alertMessage = new AlertMessage();
    alertMessage.alertRuleId = alertRuleId;
    alertMessage.receptorType = dto.receptorType as ReceptorType;
    alertMessage.messageData = dto.messageData as MessageData;
    alertMessage.messageGroupId = dto.messageGroupId;
    alertMessage.status = dto.status ?? 'pending';
    return alertMessage;
  }

  static createFromExisting(original: AlertMessage): AlertMessage {
    const duplicated = new AlertMessage();
    duplicated.alertRuleId = original.alertRuleId;
    duplicated.receptorType = original.receptorType;
    duplicated.messageData = original.messageData;
    duplicated.messageGroupId = original.messageGroupId;
    duplicated.status = original.status;
    return duplicated;
  }
}

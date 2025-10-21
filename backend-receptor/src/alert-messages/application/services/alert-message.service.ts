import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AlertMessageRepository } from '../../domain/repositories/alert-message.repository';
import { AlertMessage } from '../../domain/entities/alert-message.entity';
import {
  CreateAlertMessageDto,
  UpdateAlertMessageDto,
} from '../dtos/alert-message.dto';
import { AlertMessageFactory } from '../factories/alert-message.factory';
import { AlertRuleService } from '../../../alert-rules/application/services/alert-rule.service';
import { MessageGroupService } from '../../../message-groups/application/services/message-group.service';

@Injectable()
export class AlertMessageService {
  constructor(
    private readonly alertMessageRepository: AlertMessageRepository,
    private readonly alertRuleService: AlertRuleService,
    private readonly messageGroupService: MessageGroupService
  ) {}

  async getAllAlertMessages(): Promise<AlertMessage[]> {
    return this.alertMessageRepository.find({
      relations: ['messageGroup', 'alertRule'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAlertMessageById(id: number): Promise<AlertMessage> {
    const message = await this.alertMessageRepository.findWithRelations(id);

    if (!message) {
      throw new NotFoundException(`Alert message with ID ${id} not found`);
    }

    return message;
  }

  async createAlertMessage(
    alertRuleId: number,
    createDto: CreateAlertMessageDto
  ): Promise<AlertMessage> {
    await this.alertRuleService.getAlertRuleById(alertRuleId);

    await this.messageGroupService.getMessageGroupById(
      createDto.messageGroupId
    );

    const existingMessages =
      await this.alertMessageRepository.findByAlertRuleId(alertRuleId);

    if (existingMessages.length >= 5) {
      throw new BadRequestException(
        'Maximum 5 messages per alert rule exceeded'
      );
    }

    const alertMessage = AlertMessageFactory.createFromDto(
      createDto,
      alertRuleId
    );
    return await this.alertMessageRepository.save(alertMessage);
  }

  async updateAlertMessage(
    id: number,
    updateDto: UpdateAlertMessageDto
  ): Promise<AlertMessage> {
    const message = await this.getAlertMessageById(id);

    if (updateDto.messageGroupId) {
      await this.messageGroupService.getMessageGroupById(
        updateDto.messageGroupId
      );
    }

    Object.assign(message, updateDto);
    return this.alertMessageRepository.save(message);
  }

  async deleteAlertMessage(id: number): Promise<void> {
    const message = await this.getAlertMessageById(id);
    await this.alertMessageRepository.remove(message);
  }

  async duplicateAlertMessage(id: number): Promise<AlertMessage> {
    const originalMessage = await this.getAlertMessageById(id);

    const existingMessages =
      await this.alertMessageRepository.findByAlertRuleId(
        originalMessage.alertRuleId
      );

    if (existingMessages.length >= 5) {
      throw new BadRequestException(
        'Maximum 5 messages per alert rule exceeded. Cannot duplicate.'
      );
    }

    const duplicatedMessage =
      AlertMessageFactory.createFromExisting(originalMessage);
    return await this.alertMessageRepository.save(duplicatedMessage);
  }

  async getMessagesByAlertRuleId(alertRuleId: number): Promise<AlertMessage[]> {
    await this.alertRuleService.getAlertRuleById(alertRuleId);

    return this.alertMessageRepository.findByAlertRuleId(alertRuleId);
  }
}

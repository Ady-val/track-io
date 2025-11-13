import { Injectable, Logger } from '@nestjs/common';
import { AlertEscalationMessageRepository } from '../../domain/repositories/alert-escalation-message.repository';
import { CreateAlertEscalationMessageDto } from '../dtos/create-alert-escalation-message.dto';
import { UpdateAlertEscalationMessageDto } from '../dtos/update-alert-escalation-message.dto';
import {
  AlertLevel,
  MessageType,
} from '../../domain/entities/alert-escalation-message.entity';

@Injectable()
export class AlertEscalationMessageService {
  private readonly logger = new Logger(AlertEscalationMessageService.name);

  constructor(
    private readonly alertEscalationMessageRepository: AlertEscalationMessageRepository
  ) {}

  async create(createDto: CreateAlertEscalationMessageDto) {
    this.logger.log(
      `Creating alert escalation message for config ${createDto.escalationConfigId} and level ${createDto.level}`
    );

    const messageData: any = {
      escalationConfigId: createDto.escalationConfigId,
      level: createDto.level,
      messageType: createDto.messageType,
      targetId: createDto.targetId,
      message: createDto.message,
    };

    if (
      createDto.messageType === MessageType.TORRETA &&
      createDto.deviceColorId
    ) {
      messageData.color = createDto.deviceColorId;
    }

    return await this.alertEscalationMessageRepository.create(messageData);
  }

  async findAll() {
    return await this.alertEscalationMessageRepository.findByConfig(0);
  }

  async findById(id: number) {
    return await this.alertEscalationMessageRepository.findById(id);
  }

  async findByConfig(configId: number) {
    return await this.alertEscalationMessageRepository.findByConfig(configId);
  }

  async findByConfigAndLevel(configId: number, level: AlertLevel) {
    return await this.alertEscalationMessageRepository.findByConfigAndLevel(
      configId,
      level
    );
  }

  async findByDeviceAndSignal(deviceId: number, deviceSignalId: number) {
    this.logger.log(
      `Finding alert escalation messages for device ${deviceId} and signal ${deviceSignalId}`
    );
    return await this.alertEscalationMessageRepository.findByDeviceAndSignal(
      deviceId,
      deviceSignalId
    );
  }

  async update(id: number, updateDto: UpdateAlertEscalationMessageDto) {
    this.logger.log(`Updating alert escalation message ${id}`);

    const updateData: any = {};
    if (updateDto.messageType !== undefined)
      updateData.messageType = updateDto.messageType;
    if (updateDto.targetId !== undefined) updateData.targetId = updateDto.targetId;
    if (updateDto.message !== undefined) updateData.message = updateDto.message;
    if (updateDto.deviceColorId !== undefined)
      updateData.color = updateDto.deviceColorId;

    return await this.alertEscalationMessageRepository.update(id, updateData);
  }

  async delete(id: number) {
    this.logger.log(`Deleting alert escalation message ${id}`);
    await this.alertEscalationMessageRepository.delete(id);
  }

  async deleteByConfig(configId: number) {
    this.logger.log(`Deleting all messages for config ${configId}`);
    await this.alertEscalationMessageRepository.deleteByConfig(configId);
  }

  async count() {
    return await this.alertEscalationMessageRepository.count();
  }
}

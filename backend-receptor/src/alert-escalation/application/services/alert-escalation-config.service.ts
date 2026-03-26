import { Injectable, Logger } from '@nestjs/common';
import { resolveNodeRedEventsUrl } from '../../../config/node-red-events-url';
import { AlertEscalationConfigRepository } from '../../domain/repositories/alert-escalation-config.repository';
import { CreateAlertEscalationConfigDto } from '../dtos/create-alert-escalation-config.dto';
import { UpdateAlertEscalationConfigDto } from '../dtos/update-alert-escalation-config.dto';
import { CreateEscalationConfigWithMessagesDto } from '../dtos/create-escalation-config-with-messages.dto';
import { SaveEscalationConfigDto } from '../dtos/save-escalation-config.dto';
import { AlertEscalationMessageRepository } from '../../domain/repositories/alert-escalation-message.repository';
import { TorretaColorService } from '../../../torreta-colors/application/services/torreta-color.service';
import {
  MessageType,
  AlertLevel,
} from '../../domain/entities/alert-escalation-message.entity';
import type { CreateAlertEscalationMessageDto } from '../../domain/repositories/alert-escalation-message.repository';

@Injectable()
export class AlertEscalationConfigService {
  private readonly logger = new Logger(AlertEscalationConfigService.name);

  constructor(
    private readonly alertEscalationConfigRepository: AlertEscalationConfigRepository,
    private readonly alertEscalationMessageRepository: AlertEscalationMessageRepository,
    private readonly torretaColorService: TorretaColorService
  ) {}

  async create(createDto: CreateAlertEscalationConfigDto) {
    this.logger.log(
      `Creating alert escalation config for device ${createDto.deviceId} and signal ${createDto.deviceSignalId}`
    );
    return await this.alertEscalationConfigRepository.create(createDto);
  }

  async createWithMessages(createDto: CreateEscalationConfigWithMessagesDto) {
    this.logger.log(
      `Creating alert escalation config with messages for device ${createDto.deviceId} and signal ${createDto.deviceSignalId}`
    );

    const config = await this.alertEscalationConfigRepository.create(createDto);

    if (createDto.messages && createDto.messages.length > 0) {
      for (const messageDto of createDto.messages) {
        const messageData: CreateAlertEscalationMessageDto & {
          color?: string;
        } = {
          escalationConfigId: config.id,
          level: messageDto.level as AlertLevel,
          messageType: messageDto.messageType as MessageType,
          targetId: messageDto.targetId,
          message: messageDto.message,
        };

        if (
          (messageDto.messageType as MessageType) === MessageType.TORRETA &&
          messageDto.deviceColorId
        ) {
          messageData.color = messageDto.deviceColorId;
        } else if (
          (messageDto.messageType as MessageType) === MessageType.TORRETA &&
          'color' in messageDto &&
          typeof messageDto.color === 'string'
        ) {
          const hexColor = messageDto.color;
          const torretaColor =
            await this.torretaColorService.getTorretaColorByHtmlColor(
              hexColor.toUpperCase().trim()
            );
          if (torretaColor) {
            messageData.color = torretaColor.deviceColorId;
            this.logger.log(
              `Converted hex color "${hexColor}" to deviceColorId "${torretaColor.deviceColorId}"`
            );
          } else {
            this.logger.warn(
              `Could not convert hex color "${hexColor}" to deviceColorId, saving as is`
            );
            messageData.color = hexColor;
          }
        }

        await this.alertEscalationMessageRepository.create(messageData);
      }
    }

    return config;
  }

  async saveEscalationConfig(dto: SaveEscalationConfigDto) {
    this.logger.log(
      `Saving escalation config for device ${dto.deviceId} and signal ${dto.deviceSignalId}`
    );

    const existingConfig =
      await this.alertEscalationConfigRepository.findByDeviceAndSignal(
        dto.deviceId,
        dto.deviceSignalId
      );

    let config;
    if (existingConfig) {
      const updateData: Partial<UpdateAlertEscalationConfigDto> & {
        endpointUrl: string;
      } = {
        endpointUrl: resolveNodeRedEventsUrl(),
      };
      if (dto.warningDelayMinutes !== undefined)
        updateData.warningDelayMinutes = dto.warningDelayMinutes;
      if (dto.escalation1DelayMinutes !== undefined)
        updateData.escalation1DelayMinutes = dto.escalation1DelayMinutes;
      if (dto.escalation2DelayMinutes !== undefined)
        updateData.escalation2DelayMinutes = dto.escalation2DelayMinutes;
      if (dto.escalation3DelayMinutes !== undefined)
        updateData.escalation3DelayMinutes = dto.escalation3DelayMinutes;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      config = await this.alertEscalationConfigRepository.update(
        existingConfig.id,
        updateData
      );
    } else {
      const createData: Partial<CreateAlertEscalationConfigDto> & {
        deviceId: number;
        deviceSignalId: number;
        endpointUrl: string;
      } = {
        deviceId: dto.deviceId,
        deviceSignalId: dto.deviceSignalId,
        endpointUrl: resolveNodeRedEventsUrl(),
      };
      if (dto.warningDelayMinutes !== undefined)
        createData.warningDelayMinutes = dto.warningDelayMinutes;
      if (dto.escalation1DelayMinutes !== undefined)
        createData.escalation1DelayMinutes = dto.escalation1DelayMinutes;
      if (dto.escalation2DelayMinutes !== undefined)
        createData.escalation2DelayMinutes = dto.escalation2DelayMinutes;
      if (dto.escalation3DelayMinutes !== undefined)
        createData.escalation3DelayMinutes = dto.escalation3DelayMinutes;
      if (dto.isActive !== undefined) createData.isActive = dto.isActive;

      config = await this.alertEscalationConfigRepository.create(createData);
    }

    if (config) {
      await this.alertEscalationMessageRepository.deleteByConfig(config.id);
    }

    if (dto.messages && dto.messages.length > 0 && config) {
      for (const messageDto of dto.messages) {
        const messageData: CreateAlertEscalationMessageDto & {
          color?: string;
        } = {
          escalationConfigId: config.id,
          level: messageDto.level as AlertLevel,
          messageType: messageDto.messageType as MessageType,
          targetId: messageDto.targetId,
          message: messageDto.message,
        };

        if (
          (messageDto.messageType as MessageType) === MessageType.TORRETA &&
          messageDto.deviceColorId
        ) {
          messageData.color = messageDto.deviceColorId;
        } else if (
          (messageDto.messageType as MessageType) === MessageType.TORRETA &&
          'color' in messageDto &&
          typeof messageDto.color === 'string'
        ) {
          const hexColor = messageDto.color;
          const torretaColor =
            await this.torretaColorService.getTorretaColorByHtmlColor(
              hexColor.toUpperCase().trim()
            );
          if (torretaColor) {
            messageData.color = torretaColor.deviceColorId;
            this.logger.log(
              `Converted hex color "${hexColor}" to deviceColorId "${torretaColor.deviceColorId}"`
            );
          } else {
            this.logger.warn(
              `Could not convert hex color "${hexColor}" to deviceColorId, saving as is`
            );
            messageData.color = hexColor;
          }
        }

        await this.alertEscalationMessageRepository.create(messageData);
      }
    }

    return config;
  }

  async findAll() {
    return await this.alertEscalationConfigRepository.findAll();
  }

  async findById(id: number) {
    return await this.alertEscalationConfigRepository.findById(id);
  }

  async findByDeviceAndSignal(deviceId: number, deviceSignalId: number) {
    return await this.alertEscalationConfigRepository.findByDeviceAndSignal(
      deviceId,
      deviceSignalId
    );
  }

  async update(id: number, updateDto: UpdateAlertEscalationConfigDto) {
    this.logger.log(`Updating alert escalation config ${id}`);
    return await this.alertEscalationConfigRepository.update(id, updateDto);
  }

  async delete(id: number) {
    this.logger.log(`Deleting alert escalation config ${id}`);
    await this.alertEscalationConfigRepository.delete(id);
  }

  async count() {
    return await this.alertEscalationConfigRepository.count();
  }
}

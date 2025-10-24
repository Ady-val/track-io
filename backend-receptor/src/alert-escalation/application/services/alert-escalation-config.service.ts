import { Injectable, Logger } from '@nestjs/common';
import { AlertEscalationConfigRepository } from '../../domain/repositories/alert-escalation-config.repository';
import { CreateAlertEscalationConfigDto } from '../dtos/create-alert-escalation-config.dto';
import { UpdateAlertEscalationConfigDto } from '../dtos/update-alert-escalation-config.dto';
import { CreateEscalationConfigWithMessagesDto } from '../dtos/create-escalation-config-with-messages.dto';
import { SaveEscalationConfigDto } from '../dtos/save-escalation-config.dto';
import { AlertEscalationMessageRepository } from '../../domain/repositories/alert-escalation-message.repository';

@Injectable()
export class AlertEscalationConfigService {
  private readonly logger = new Logger(AlertEscalationConfigService.name);

  constructor(
    private readonly alertEscalationConfigRepository: AlertEscalationConfigRepository,
    private readonly alertEscalationMessageRepository: AlertEscalationMessageRepository
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

    // Crear la configuración
    const config = await this.alertEscalationConfigRepository.create(createDto);

    // Crear los mensajes si existen
    if (createDto.messages && createDto.messages.length > 0) {
      for (const messageDto of createDto.messages) {
        const messageData: any = {
          escalationConfigId: config.id,
          level: messageDto.level as any,
          messageType: messageDto.messageType as any,
          targetId: messageDto.targetId,
          message: messageDto.message,
        };

        if (messageDto.color) {
          messageData.color = messageDto.color;
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

    // Buscar si ya existe una configuración para este device y signal
    const existingConfig =
      await this.alertEscalationConfigRepository.findByDeviceAndSignal(
        dto.deviceId,
        dto.deviceSignalId
      );

    let config;
    if (existingConfig) {
      // Actualizar configuración existente
      const updateData: any = {
        endpointUrl: 'http://localhost:1880/events', // Siempre usar el endpoint por defecto
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
      // Crear nueva configuración
      const createData: any = {
        deviceId: dto.deviceId,
        deviceSignalId: dto.deviceSignalId,
        endpointUrl: 'http://localhost:1880/events', // Siempre usar el endpoint por defecto
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

    // Eliminar mensajes existentes para este config
    if (config) {
      await this.alertEscalationMessageRepository.deleteByConfig(config.id);
    }

    // Crear nuevos mensajes si existen
    if (dto.messages && dto.messages.length > 0 && config) {
      for (const messageDto of dto.messages) {
        const messageData: any = {
          escalationConfigId: config.id,
          level: messageDto.level as any,
          messageType: messageDto.messageType as any,
          targetId: messageDto.targetId,
          message: messageDto.message,
        };

        if (messageDto.color) {
          messageData.color = messageDto.color;
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

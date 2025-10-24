import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AlertEscalationMessage,
  AlertLevel,
  MessageType,
} from '../entities/alert-escalation-message.entity';

export interface CreateAlertEscalationMessageDto {
  escalationConfigId: number;
  level: AlertLevel;
  messageType: MessageType;
  targetId: string;
  message: string;
  color?: string;
}

export interface UpdateAlertEscalationMessageDto {
  messageType?: MessageType;
  targetId?: string;
  message?: string;
  color?: string;
}

@Injectable()
export class AlertEscalationMessageRepository {
  constructor(
    @InjectRepository(AlertEscalationMessage)
    private readonly repository: Repository<AlertEscalationMessage>
  ) {}

  async create(
    dto: CreateAlertEscalationMessageDto
  ): Promise<AlertEscalationMessage> {
    const message = this.repository.create(dto);
    return await this.repository.save(message);
  }

  async findById(id: number): Promise<AlertEscalationMessage | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['escalationConfig'],
    });
  }

  async findByConfigAndLevel(
    configId: number,
    level: AlertLevel
  ): Promise<AlertEscalationMessage[]> {
    return await this.repository.find({
      where: { escalationConfigId: configId, level },
      relations: ['escalationConfig'],
    });
  }

  async findByConfig(configId: number): Promise<AlertEscalationMessage[]> {
    return await this.repository.find({
      where: { escalationConfigId: configId },
      relations: ['escalationConfig'],
      order: { level: 'ASC', createdAt: 'ASC' },
    });
  }

  async findByDeviceAndSignal(
    deviceId: number,
    deviceSignalId: number
  ): Promise<AlertEscalationMessage[]> {
    return await this.repository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.escalationConfig', 'config')
      .where('config.deviceId = :deviceId', { deviceId })
      .andWhere('config.deviceSignalId = :deviceSignalId', { deviceSignalId })
      .andWhere('config.isActive = :isActive', { isActive: true })
      .orderBy('message.level', 'ASC')
      .addOrderBy('message.createdAt', 'ASC')
      .getMany();
  }

  async update(
    id: number,
    dto: UpdateAlertEscalationMessageDto
  ): Promise<AlertEscalationMessage | null> {
    await this.repository.update(id, dto);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async deleteByConfig(configId: number): Promise<void> {
    await this.repository.softDelete({ escalationConfigId: configId });
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }
}

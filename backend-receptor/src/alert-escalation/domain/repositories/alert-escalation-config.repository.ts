import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertEscalationConfig } from '../entities/alert-escalation-config.entity';

export interface CreateAlertEscalationConfigDto {
  deviceId: number;
  deviceSignalId: number;
  endpointUrl?: string;
  warningDelayMinutes?: number;
  escalation1DelayMinutes?: number;
  escalation2DelayMinutes?: number;
  escalation3DelayMinutes?: number;
  isActive?: boolean;
}

export interface UpdateAlertEscalationConfigDto {
  endpointUrl?: string;
  warningDelayMinutes?: number;
  escalation1DelayMinutes?: number;
  escalation2DelayMinutes?: number;
  escalation3DelayMinutes?: number;
  isActive?: boolean;
}

@Injectable()
export class AlertEscalationConfigRepository {
  constructor(
    @InjectRepository(AlertEscalationConfig)
    private readonly repository: Repository<AlertEscalationConfig>
  ) {}

  async create(
    dto: CreateAlertEscalationConfigDto
  ): Promise<AlertEscalationConfig> {
    const config = this.repository.create(dto);
    return await this.repository.save(config);
  }

  async findById(id: number): Promise<AlertEscalationConfig | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['device', 'deviceSignal'],
    });
  }

  async findByDeviceAndSignal(
    deviceId: number,
    deviceSignalId: number
  ): Promise<AlertEscalationConfig | null> {
    return await this.repository.findOne({
      where: { deviceId, deviceSignalId, isActive: true },
      relations: ['device', 'deviceSignal'],
    });
  }

  async findAll(): Promise<AlertEscalationConfig[]> {
    return await this.repository.find({
      relations: ['device', 'deviceSignal'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: number,
    dto: UpdateAlertEscalationConfigDto
  ): Promise<AlertEscalationConfig | null> {
    await this.repository.update(id, dto);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }
}

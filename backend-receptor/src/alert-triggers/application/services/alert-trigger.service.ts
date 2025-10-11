import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AlertTriggerRepository,
  AlertTriggerFilters,
} from '../../domain/repositories/alert-trigger.repository';
import { AlertTrigger } from '../../domain/entities/alert-trigger.entity';
import { CreateAlertTriggerDto } from '../dtos/alert-trigger.dto';

@Injectable()
export class AlertTriggerService {
  constructor(
    private readonly alertTriggerRepository: AlertTriggerRepository
  ) {}

  async getAllAlertTriggers(
    filters?: AlertTriggerFilters
  ): Promise<{ data: AlertTrigger[]; total: number }> {
    return this.alertTriggerRepository.findWithFilters(filters);
  }

  async getAlertTriggerById(id: number): Promise<AlertTrigger> {
    const trigger = await this.alertTriggerRepository.findOne({
      where: { id },
      relations: ['alertRule', 'alertRule.measurement'],
    });

    if (!trigger) {
      throw new NotFoundException(`Alert trigger with ID ${id} not found`);
    }

    return trigger;
  }

  async createAlertTrigger(
    createDto: CreateAlertTriggerDto
  ): Promise<AlertTrigger> {
    const trigger = this.alertTriggerRepository.create(createDto);
    return this.alertTriggerRepository.save(trigger);
  }

  async getTriggersByAlertRuleId(alertRuleId: number): Promise<AlertTrigger[]> {
    return this.alertTriggerRepository.findByAlertRuleId(alertRuleId);
  }

  async getAlertRuleStats(alertRuleId: number): Promise<{
    totalTriggers: number;
    lastTriggeredAt: Date | null;
    avgValue: number;
    minValue: number;
    maxValue: number;
  }> {
    return this.alertTriggerRepository.getStatsForAlertRule(alertRuleId);
  }
}


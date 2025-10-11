import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AlertRule } from '../entities/alert-rule.entity';

export interface AlertRuleFilters {
  measurementId?: number;
  isEnabled?: boolean;
  mode?: string;
}

@Injectable()
export class AlertRuleRepository extends Repository<AlertRule> {
  constructor(dataSource: DataSource) {
    super(AlertRule, dataSource.createEntityManager());
  }

  async findAllWithFilters(
    filters: AlertRuleFilters = {}
  ): Promise<AlertRule[]> {
    const query = this.createQueryBuilder('alertRule')
      .leftJoinAndSelect('alertRule.measurement', 'measurement')
      .orderBy('alertRule.createdAt', 'DESC');

    if (filters.measurementId) {
      query.andWhere('alertRule.measurementId = :measurementId', {
        measurementId: filters.measurementId,
      });
    }

    if (filters.isEnabled !== undefined) {
      query.andWhere('alertRule.isEnabled = :isEnabled', {
        isEnabled: filters.isEnabled,
      });
    }

    if (filters.mode) {
      query.andWhere('alertRule.mode = :mode', { mode: filters.mode });
    }

    return query.getMany();
  }

  async findByMeasurementId(measurementId: number): Promise<AlertRule[]> {
    return this.find({
      where: { measurementId },
      relations: ['measurement'],
    });
  }

  async findEnabledRules(): Promise<AlertRule[]> {
    return this.find({
      where: { isEnabled: true },
      relations: ['measurement'],
    });
  }
}


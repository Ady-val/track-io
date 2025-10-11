import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AlertTrigger } from '../entities/alert-trigger.entity';

export interface AlertTriggerFilters {
  alertRuleId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AlertTriggerRepository extends Repository<AlertTrigger> {
  constructor(dataSource: DataSource) {
    super(AlertTrigger, dataSource.createEntityManager());
  }

  async findWithFilters(
    filters: AlertTriggerFilters = {}
  ): Promise<{ data: AlertTrigger[]; total: number }> {
    const query = this.createQueryBuilder('trigger')
      .leftJoinAndSelect('trigger.alertRule', 'alertRule')
      .leftJoinAndSelect('alertRule.measurement', 'measurement')
      .orderBy('trigger.triggeredAt', 'DESC');

    if (filters.alertRuleId) {
      query.andWhere('trigger.alertRuleId = :alertRuleId', {
        alertRuleId: filters.alertRuleId,
      });
    }

    if (filters.startDate) {
      query.andWhere('trigger.triggeredAt >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere('trigger.triggeredAt <= :endDate', {
        endDate: filters.endDate,
      });
    }

    const total = await query.getCount();

    if (filters.limit) {
      query.limit(filters.limit);
    }

    if (filters.offset) {
      query.offset(filters.offset);
    }

    const data = await query.getMany();

    return { data, total };
  }

  async findByAlertRuleId(alertRuleId: number): Promise<AlertTrigger[]> {
    return this.find({
      where: { alertRuleId },
      relations: ['alertRule'],
      order: { triggeredAt: 'DESC' },
      take: 100,
    });
  }

  async countByAlertRuleId(alertRuleId: number): Promise<number> {
    return this.count({ where: { alertRuleId } });
  }

  async getStatsForAlertRule(alertRuleId: number): Promise<{
    totalTriggers: number;
    lastTriggeredAt: Date | null;
    avgValue: number;
    minValue: number;
    maxValue: number;
  }> {
    const result = await this.createQueryBuilder('trigger')
      .select('COUNT(*)', 'totalTriggers')
      .addSelect('MAX(trigger.triggeredAt)', 'lastTriggeredAt')
      .addSelect('AVG(trigger.measurementValue)', 'avgValue')
      .addSelect('MIN(trigger.measurementValue)', 'minValue')
      .addSelect('MAX(trigger.measurementValue)', 'maxValue')
      .where('trigger.alertRuleId = :alertRuleId', { alertRuleId })
      .getRawOne<{
        totalTriggers: string;
        lastTriggeredAt: Date | null;
        avgValue: string;
        minValue: string;
        maxValue: string;
      }>();

    return {
      totalTriggers: result ? parseInt(result.totalTriggers, 10) : 0,
      lastTriggeredAt: result?.lastTriggeredAt ?? null,
      avgValue: result ? parseFloat(result.avgValue) : 0,
      minValue: result ? parseFloat(result.minValue) : 0,
      maxValue: result ? parseFloat(result.maxValue) : 0,
    };
  }
}

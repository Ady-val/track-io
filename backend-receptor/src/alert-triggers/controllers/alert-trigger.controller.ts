import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AlertTriggerService } from '../application/services/alert-trigger.service';
import { AlertTrigger } from '../domain/entities/alert-trigger.entity';
import { AlertTriggerFilters } from '../domain/repositories/alert-trigger.repository';

@Controller()
export class AlertTriggerController {
  constructor(private readonly alertTriggerService: AlertTriggerService) {}

  @Get('alert-triggers')
  async getAllAlertTriggers(
    @Query('alertRuleId') alertRuleId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ): Promise<{
    message: string;
    data: AlertTrigger[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: AlertTriggerFilters = {};

    if (alertRuleId) filters.alertRuleId = parseInt(alertRuleId);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;

    const { data, total } =
      await this.alertTriggerService.getAllAlertTriggers(filters);

    return {
      message: 'Alert triggers retrieved successfully',
      data,
      total,
      pagination: {
        limit: limit ?? 50,
        offset: offset ?? 0,
        total,
      },
    };
  }

  @Get('alert-triggers/:id')
  async getAlertTriggerById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: AlertTrigger;
  }> {
    const trigger = await this.alertTriggerService.getAlertTriggerById(id);

    return {
      message: 'Alert trigger found',
      data: trigger,
    };
  }

  @Get('alert-rules/:ruleId/triggers')
  async getTriggersByAlertRuleId(
    @Param('ruleId', ParseIntPipe) ruleId: number
  ): Promise<{
    message: string;
    data: AlertTrigger[];
  }> {
    const triggers =
      await this.alertTriggerService.getTriggersByAlertRuleId(ruleId);

    return {
      message: 'Alert rule triggers retrieved successfully',
      data: triggers,
    };
  }

  @Get('alert-rules/:ruleId/stats')
  async getAlertRuleStats(
    @Param('ruleId', ParseIntPipe) ruleId: number
  ): Promise<{
    message: string;
    data: {
      totalTriggers: number;
      lastTriggeredAt: Date | null;
      avgValue: number;
      minValue: number;
      maxValue: number;
    };
  }> {
    const stats = await this.alertTriggerService.getAlertRuleStats(ruleId);

    return {
      message: 'Alert rule stats retrieved successfully',
      data: stats,
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AlertRuleService } from '../application/services/alert-rule.service';
import { AlertRule } from '../domain/entities/alert-rule.entity';
import {
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
} from '../application/dtos/alert-rule.dto';

interface AlertRuleFilters {
  measurementId?: number;
  isEnabled?: boolean;
  mode?: string;
}

@Controller('alert-rules')
export class AlertRuleController {
  constructor(private readonly alertRuleService: AlertRuleService) {}

  @Get()
  async getAllAlertRules(
    @Query('measurementId') measurementId?: string,
    @Query('isEnabled') isEnabled?: string,
    @Query('mode') mode?: string
  ): Promise<{
    message: string;
    data: AlertRule[];
    total: number;
  }> {
    const filters: AlertRuleFilters = {};

    if (measurementId) filters.measurementId = parseInt(measurementId);
    if (isEnabled !== undefined) filters.isEnabled = isEnabled === 'true';
    if (mode) filters.mode = mode;

    const rules = await this.alertRuleService.getAllAlertRules(filters);

    return {
      message: 'Alert rules retrieved successfully',
      data: rules,
      total: rules.length,
    };
  }

  @Get(':id')
  async getAlertRuleById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: AlertRule;
  }> {
    const rule = await this.alertRuleService.getAlertRuleById(id);

    return {
      message: 'Alert rule found',
      data: rule,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAlertRule(@Body() createDto: CreateAlertRuleDto): Promise<{
    message: string;
    data: AlertRule;
  }> {
    const rule = await this.alertRuleService.createAlertRule(createDto);

    return {
      message: 'Alert rule created successfully',
      data: rule,
    };
  }

  @Put(':id')
  async updateAlertRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAlertRuleDto
  ): Promise<{
    message: string;
    data: AlertRule;
  }> {
    const rule = await this.alertRuleService.updateAlertRule(id, updateDto);

    return {
      message: 'Alert rule updated successfully',
      data: rule,
    };
  }

  @Patch(':id/toggle')
  async toggleAlertRule(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: AlertRule;
  }> {
    const rule = await this.alertRuleService.toggleAlertRule(id);

    return {
      message: `Alert rule ${rule.isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: rule,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAlertRule(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.alertRuleService.deleteAlertRule(id);
  }
}

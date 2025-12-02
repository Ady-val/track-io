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
  UseGuards,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AlertRuleService } from '../application/services/alert-rule.service';
import {
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  AlertRuleResponseDto,
} from '../application/dtos/alert-rule.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';

interface AlertRuleFilters {
  measurementId?: number;
  isEnabled?: boolean;
  mode?: string;
}

@Controller('alert-rules')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AlertRuleController {
  constructor(private readonly alertRuleService: AlertRuleService) {}

  @Get()
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.READ)
  async getAllAlertRules(
    @Query('measurementId') measurementId?: string,
    @Query('isEnabled') isEnabled?: string,
    @Query('mode') mode?: string
  ): Promise<{
    message: string;
    data: AlertRuleResponseDto[];
    total: number;
  }> {
    const filters: AlertRuleFilters = {};

    if (measurementId) filters.measurementId = parseInt(measurementId);
    if (isEnabled !== undefined) filters.isEnabled = isEnabled === 'true';
    if (mode) filters.mode = mode;

    const rules = await this.alertRuleService.getAllAlertRules(filters);
    const alertRuleResponses = plainToInstance(AlertRuleResponseDto, rules, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Alert rules retrieved successfully',
      data: alertRuleResponses,
      total: alertRuleResponses.length,
    };
  }

  @Get(':id')
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.READ)
  async getAlertRuleById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: AlertRuleResponseDto;
  }> {
    const rule = await this.alertRuleService.getAlertRuleById(id);
    const alertRuleResponse = plainToInstance(AlertRuleResponseDto, rule, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Alert rule found',
      data: alertRuleResponse,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.CREATE)
  async createAlertRule(@Body() createDto: CreateAlertRuleDto): Promise<{
    message: string;
    data: AlertRuleResponseDto;
  }> {
    const rule = await this.alertRuleService.createAlertRule(createDto);
    const alertRuleResponse = plainToInstance(AlertRuleResponseDto, rule, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Alert rule created successfully',
      data: alertRuleResponse,
    };
  }

  @Put(':id')
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.UPDATE)
  async updateAlertRule(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAlertRuleDto
  ): Promise<{
    message: string;
    data: AlertRuleResponseDto;
  }> {
    const rule = await this.alertRuleService.updateAlertRule(id, updateDto);
    const alertRuleResponse = plainToInstance(AlertRuleResponseDto, rule, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Alert rule updated successfully',
      data: alertRuleResponse,
    };
  }

  @Patch(':id/toggle')
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.UPDATE)
  async toggleAlertRule(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: AlertRuleResponseDto;
  }> {
    const rule = await this.alertRuleService.toggleAlertRule(id);
    const alertRuleResponse = plainToInstance(AlertRuleResponseDto, rule, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: `Alert rule ${rule.isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: alertRuleResponse,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.DELETE)
  async deleteAlertRule(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.alertRuleService.deleteAlertRule(id);
  }
}

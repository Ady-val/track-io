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
import {
  AlertMessageResponseDto,
  MessageGroupResponseDto,
} from '../application/dtos/alert-message-response.dto';
import { AlertMessage } from '../../alert-messages/domain/entities/alert-message.entity';
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

    // Transform messages to ensure proper serialization
    alertRuleResponse.messages = this.transformMessages(rule.messages, rule.id);

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

  /**
   * Transforms AlertMessage entities to AlertMessageResponseDto
   * @param messages - Array of AlertMessage entities or undefined
   * @param alertRuleId - The ID of the alert rule
   * @returns Array of AlertMessageResponseDto
   */
  private transformMessages(
    messages: AlertMessage[] | undefined,
    alertRuleId: number
  ): AlertMessageResponseDto[] {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return [];
    }

    return messages.map((msg) => {
      const messageDto = plainToInstance(
        AlertMessageResponseDto,
        {
          id: msg.id,
          messageType: msg.messageType,
          targetId: msg.targetId,
          message: msg.message,
          messageGroupId: msg.messageGroupId,
          status: msg.status,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          alertRuleId: alertRuleId.toString(),
        },
        {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        }
      );

      // Add optional color if present
      if (msg.color) {
        messageDto.color = msg.color;
      }

      // Add messageGroup if present
      if (msg.messageGroup) {
        messageDto.messageGroup = plainToInstance(
          MessageGroupResponseDto,
          {
            id: msg.messageGroup.id,
            nombre: msg.messageGroup.name,
            color: msg.messageGroup.color,
            descripcion: msg.messageGroup.description,
          },
          {
            excludeExtraneousValues: true,
            enableImplicitConversion: true,
          }
        );
      }

      return messageDto;
    });
  }
}

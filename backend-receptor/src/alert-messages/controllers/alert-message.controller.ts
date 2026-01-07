import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AlertMessageService } from '../application/services/alert-message.service';
import { AlertMessage } from '../domain/entities/alert-message.entity';
import {
  CreateAlertMessageDto,
  UpdateAlertMessageDto,
} from '../application/dtos/alert-message.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

@SystemModuleTag(SystemModule.MEASUREMENTS)
@Controller()
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AlertMessageController {
  constructor(private readonly alertMessageService: AlertMessageService) {}

  @Get('messages')
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.READ)
  async getAllAlertMessages(): Promise<{
    message: string;
    data: AlertMessage[];
  }> {
    const messages = await this.alertMessageService.getAllAlertMessages();

    return {
      message: 'Alert messages retrieved successfully',
      data: messages,
    };
  }

  @Get('messages/:id')
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.READ)
  async getAlertMessageById(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: AlertMessage;
  }> {
    const alertMessage = await this.alertMessageService.getAlertMessageById(id);

    return {
      message: 'Alert message found',
      data: alertMessage,
    };
  }

  @Get('alert-rules/:ruleId/messages')
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.READ)
  async getMessagesByAlertRuleId(
    @Param('ruleId', ParseIntPipe) ruleId: number
  ): Promise<{
    message: string;
    data: AlertMessage[];
  }> {
    const messages =
      await this.alertMessageService.getMessagesByAlertRuleId(ruleId);

    return {
      message: 'Alert rule messages retrieved successfully',
      data: messages,
    };
  }

  @Post('alert-rules/:ruleId/messages')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.CREATE)
  async createAlertMessage(
    @Param('ruleId', ParseIntPipe) ruleId: number,
    @Body() createDto: CreateAlertMessageDto
  ): Promise<{
    message: string;
    data: AlertMessage;
  }> {
    const alertMessage = await this.alertMessageService.createAlertMessage(
      ruleId,
      createDto
    );

    return {
      message: 'Alert message created successfully',
      data: alertMessage,
    };
  }

  @Patch('messages/:id')
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.UPDATE)
  async updateAlertMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAlertMessageDto
  ): Promise<{
    message: string;
    data: AlertMessage;
  }> {
    const alertMessage = await this.alertMessageService.updateAlertMessage(
      id,
      updateDto
    );

    return {
      message: 'Alert message updated successfully',
      data: alertMessage,
    };
  }

  @Post('messages/:id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.CREATE)
  async duplicateAlertMessage(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
    data: AlertMessage;
  }> {
    const duplicatedMessage =
      await this.alertMessageService.duplicateAlertMessage(id);

    return {
      message: 'Alert message duplicated successfully',
      data: duplicatedMessage,
    };
  }

  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.MEASUREMENT_ALERTS, Action.DELETE)
  async deleteAlertMessage(
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    await this.alertMessageService.deleteAlertMessage(id);
  }
}

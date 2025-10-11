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
} from '@nestjs/common';
import { AlertMessageService } from '../application/services/alert-message.service';
import { AlertMessage } from '../domain/entities/alert-message.entity';
import {
  CreateAlertMessageDto,
  UpdateAlertMessageDto,
} from '../application/dtos/alert-message.dto';

@Controller()
export class AlertMessageController {
  constructor(private readonly alertMessageService: AlertMessageService) {}

  // Get all messages (general endpoint)
  @Get('messages')
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

  // Get single message
  @Get('messages/:id')
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

  // Get messages for a specific alert rule
  @Get('alert-rules/:ruleId/messages')
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

  // Create message for an alert rule
  @Post('alert-rules/:ruleId/messages')
  @HttpCode(HttpStatus.CREATED)
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

  // Update message
  @Patch('messages/:id')
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

  // Duplicate message
  @Post('messages/:id/duplicate')
  @HttpCode(HttpStatus.CREATED)
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

  // Delete message
  @Delete('messages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAlertMessage(
    @Param('id', ParseIntPipe) id: number
  ): Promise<void> {
    await this.alertMessageService.deleteAlertMessage(id);
  }
}


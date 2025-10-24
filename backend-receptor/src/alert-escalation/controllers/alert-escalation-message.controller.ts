import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AlertEscalationMessageService } from '../application/services/alert-escalation-message.service';
import { CreateAlertEscalationMessageDto } from '../application/dtos/create-alert-escalation-message.dto';
import { UpdateAlertEscalationMessageDto } from '../application/dtos/update-alert-escalation-message.dto';
import { AlertLevel } from '../domain/entities/alert-escalation-message.entity';

@Controller('alert-escalation-messages')
export class AlertEscalationMessageController {
  constructor(
    private readonly alertEscalationMessageService: AlertEscalationMessageService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateAlertEscalationMessageDto) {
    return await this.alertEscalationMessageService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.alertEscalationMessageService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.alertEscalationMessageService.findById(id);
  }

  @Get('config/:configId')
  async findByConfig(@Param('configId', ParseIntPipe) configId: number) {
    return await this.alertEscalationMessageService.findByConfig(configId);
  }

  @Get('config/:configId/level/:level')
  async findByConfigAndLevel(
    @Param('configId', ParseIntPipe) configId: number,
    @Param('level') level: string
  ) {
    return await this.alertEscalationMessageService.findByConfigAndLevel(
      configId,
      level as AlertLevel
    );
  }

  @Get('device/:deviceId/signal/:deviceSignalId')
  async findByDeviceAndSignal(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Param('deviceSignalId', ParseIntPipe) deviceSignalId: number
  ) {
    return await this.alertEscalationMessageService.findByDeviceAndSignal(
      deviceId,
      deviceSignalId
    );
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAlertEscalationMessageDto
  ) {
    return await this.alertEscalationMessageService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.alertEscalationMessageService.delete(id);
  }

  @Delete('config/:configId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByConfig(@Param('configId', ParseIntPipe) configId: number) {
    await this.alertEscalationMessageService.deleteByConfig(configId);
  }

  @Get('count/total')
  async getCount() {
    const count = await this.alertEscalationMessageService.count();
    return { count };
  }
}

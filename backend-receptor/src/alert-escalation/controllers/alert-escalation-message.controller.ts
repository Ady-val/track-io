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
  UseGuards,
} from '@nestjs/common';
import { AlertEscalationMessageService } from '../application/services/alert-escalation-message.service';
import { CreateAlertEscalationMessageDto } from '../application/dtos/create-alert-escalation-message.dto';
import { UpdateAlertEscalationMessageDto } from '../application/dtos/update-alert-escalation-message.dto';
import { AlertLevel } from '../domain/entities/alert-escalation-message.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';

@Controller('alert-escalation-messages')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AlertEscalationMessageController {
  constructor(
    private readonly alertEscalationMessageService: AlertEscalationMessageService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.DEVICES, Action.CREATE)
  async create(@Body() createDto: CreateAlertEscalationMessageDto) {
    return await this.alertEscalationMessageService.create(createDto);
  }

  @Get()
  @RequirePermission(Module.DEVICES, Action.READ)
  async findAll() {
    return await this.alertEscalationMessageService.findAll();
  }

  @Get(':id')
  @RequirePermission(Module.DEVICES, Action.READ)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.alertEscalationMessageService.findById(id);
  }

  @Get('config/:configId')
  @RequirePermission(Module.DEVICES, Action.READ)
  async findByConfig(@Param('configId', ParseIntPipe) configId: number) {
    return await this.alertEscalationMessageService.findByConfig(configId);
  }

  @Get('config/:configId/level/:level')
  @RequirePermission(Module.DEVICES, Action.READ)
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
  @RequirePermission(Module.DEVICES, Action.READ)
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
  @RequirePermission(Module.DEVICES, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAlertEscalationMessageDto
  ) {
    return await this.alertEscalationMessageService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.DEVICES, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.alertEscalationMessageService.delete(id);
  }

  @Delete('config/:configId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.DEVICES, Action.DELETE)
  async removeByConfig(@Param('configId', ParseIntPipe) configId: number) {
    await this.alertEscalationMessageService.deleteByConfig(configId);
  }

  @Get('count/total')
  @RequirePermission(Module.DEVICES, Action.READ)
  async getCount() {
    const count = await this.alertEscalationMessageService.count();
    return { count };
  }
}

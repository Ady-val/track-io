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
import { AlertEscalationConfigService } from '../application/services/alert-escalation-config.service';
import { CreateAlertEscalationConfigDto } from '../application/dtos/create-alert-escalation-config.dto';
import { UpdateAlertEscalationConfigDto } from '../application/dtos/update-alert-escalation-config.dto';
import { CreateEscalationConfigWithMessagesDto } from '../application/dtos/create-escalation-config-with-messages.dto';
import { SaveEscalationConfigDto } from '../application/dtos/save-escalation-config.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

@SystemModuleTag(SystemModule.SIGNALS)
@Controller('alert-escalation-configs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AlertEscalationConfigController {
  constructor(
    private readonly alertEscalationConfigService: AlertEscalationConfigService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.DEVICES, Action.CREATE)
  async create(@Body() createDto: CreateAlertEscalationConfigDto) {
    return await this.alertEscalationConfigService.create(createDto);
  }

  @Post('with-messages')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.DEVICES, Action.CREATE)
  async createWithMessages(
    @Body() createDto: CreateEscalationConfigWithMessagesDto
  ) {
    return await this.alertEscalationConfigService.createWithMessages(
      createDto
    );
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(Module.DEVICES, Action.CREATE)
  async saveEscalationConfig(@Body() saveDto: SaveEscalationConfigDto) {
    return await this.alertEscalationConfigService.saveEscalationConfig(
      saveDto
    );
  }

  @Get()
  @RequirePermission(Module.DEVICES, Action.READ)
  async findAll() {
    return await this.alertEscalationConfigService.findAll();
  }

  @Get(':id')
  @RequirePermission(Module.DEVICES, Action.READ)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.alertEscalationConfigService.findById(id);
  }

  @Get('device/:deviceId/signal/:deviceSignalId')
  @RequirePermission(Module.DEVICES, Action.READ)
  async findByDeviceAndSignal(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Param('deviceSignalId', ParseIntPipe) deviceSignalId: number
  ) {
    return await this.alertEscalationConfigService.findByDeviceAndSignal(
      deviceId,
      deviceSignalId
    );
  }

  @Put(':id')
  @RequirePermission(Module.DEVICES, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAlertEscalationConfigDto
  ) {
    return await this.alertEscalationConfigService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.DEVICES, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.alertEscalationConfigService.delete(id);
  }

  @Get('count/total')
  @RequirePermission(Module.DEVICES, Action.READ)
  async getCount() {
    const count = await this.alertEscalationConfigService.count();
    return { count };
  }
}

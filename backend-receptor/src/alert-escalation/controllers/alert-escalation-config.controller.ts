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
import { AlertEscalationConfigService } from '../application/services/alert-escalation-config.service';
import { CreateAlertEscalationConfigDto } from '../application/dtos/create-alert-escalation-config.dto';
import { UpdateAlertEscalationConfigDto } from '../application/dtos/update-alert-escalation-config.dto';
import { CreateEscalationConfigWithMessagesDto } from '../application/dtos/create-escalation-config-with-messages.dto';
import { SaveEscalationConfigDto } from '../application/dtos/save-escalation-config.dto';

@Controller('alert-escalation-configs')
export class AlertEscalationConfigController {
  constructor(
    private readonly alertEscalationConfigService: AlertEscalationConfigService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateAlertEscalationConfigDto) {
    return await this.alertEscalationConfigService.create(createDto);
  }

  @Post('with-messages')
  @HttpCode(HttpStatus.CREATED)
  async createWithMessages(
    @Body() createDto: CreateEscalationConfigWithMessagesDto
  ) {
    return await this.alertEscalationConfigService.createWithMessages(
      createDto
    );
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  async saveEscalationConfig(@Body() saveDto: SaveEscalationConfigDto) {
    return await this.alertEscalationConfigService.saveEscalationConfig(
      saveDto
    );
  }

  @Get()
  async findAll() {
    return await this.alertEscalationConfigService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.alertEscalationConfigService.findById(id);
  }

  @Get('device/:deviceId/signal/:deviceSignalId')
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAlertEscalationConfigDto
  ) {
    return await this.alertEscalationConfigService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.alertEscalationConfigService.delete(id);
  }

  @Get('count/total')
  async getCount() {
    const count = await this.alertEscalationConfigService.count();
    return { count };
  }
}

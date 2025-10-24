import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EventAlertLogService } from '../application/services/event-alert-log.service';
import { AlertLevel } from '../domain/entities/alert-escalation-message.entity';

@Controller('event-alert-logs')
export class EventAlertLogController {
  constructor(private readonly eventAlertLogService: EventAlertLogService) {}

  @Get()
  async findAll() {
    return await this.eventAlertLogService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.eventAlertLogService.findById(id);
  }

  @Get('event/:eventId')
  async findByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return await this.eventAlertLogService.findByEvent(eventId);
  }

  @Get('event/:eventId/successful')
  async findSuccessfulByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return await this.eventAlertLogService.findSuccessfulByEvent(eventId);
  }

  @Get('event/:eventId/failed')
  async findFailedByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return await this.eventAlertLogService.findFailedByEvent(eventId);
  }

  @Get('level/:level')
  async findByLevel(@Param('level') level: string) {
    return await this.eventAlertLogService.findByLevel(level as AlertLevel);
  }

  @Get('count/total')
  async getCount() {
    const count = await this.eventAlertLogService.count();
    return { count };
  }

  @Get('count/event/:eventId')
  async getCountByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    const count = await this.eventAlertLogService.countByEvent(eventId);
    return { count };
  }

  @Get('count/level/:level')
  async getCountByLevel(@Param('level') level: string) {
    const count = await this.eventAlertLogService.countByLevel(
      level as AlertLevel
    );
    return { count };
  }
}

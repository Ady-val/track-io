import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TypeOrmEventRepository } from '../domain/repositories/typeorm-event.repository';
import { EventFilters } from '../domain/repositories/event.repository';
import { EventStatus } from '../domain/entities/event.entity';

@Controller('events')
export class EventController {
  constructor(private readonly eventRepository: TypeOrmEventRepository) {}

  @Get()
  async findEvents(
    @Query('deviceId') deviceId?: string,
    @Query('deviceSignalId') deviceSignalId?: string,
    @Query('status') status?: string
  ) {
    const filters: EventFilters = {};

    if (deviceId) filters.deviceId = parseInt(deviceId, 10);
    if (deviceSignalId) filters.deviceSignalId = parseInt(deviceSignalId, 10);

    // Si hay status, manejar múltiples valores separados por coma
    if (status) {
      const statuses = status.split(',');
      if (statuses.length === 1) {
        filters.status = status as EventStatus;
      } else {
        const allEvents = await this.eventRepository.findAll(filters);
        return allEvents.filter(event => statuses.includes(event.status));
      }
    }

    return await this.eventRepository.findAll(filters);
  }

  @Get('all')
  async findAllEvents() {
    return await this.eventRepository.findAll();
  }

  @Post('close-all')
  async closeAllEvents() {
    const openEvents = await this.eventRepository.findOpenEvents();

    for (const event of openEvents) {
      await this.eventRepository.closeEvent(event.id);
    }

    return {
      message: `Se cerraron ${openEvents.length} eventos`,
      closedEvents: openEvents.length,
    };
  }

  @Delete(':id')
  async closeEventById(@Param('id', ParseIntPipe) id: number) {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      return {
        message: 'Evento no encontrado',
        success: false,
      };
    }

    if (event.status === EventStatus.CLOSED) {
      return {
        message: 'El evento ya está cerrado',
        success: false,
      };
    }

    await this.eventRepository.closeEvent(id);

    return {
      message: `Evento ${id} cerrado exitosamente`,
      success: true,
      eventId: id,
    };
  }
}

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { TypeOrmEventRepository } from '../domain/repositories/typeorm-event.repository';

@Controller('events')
export class EventController {
  constructor(private readonly eventRepository: TypeOrmEventRepository) {}

  @Get()
  async findOpenEvents() {
    return await this.eventRepository.findOpenEvents();
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

    if (event.status === 'closed') {
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

import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AreaDowntime } from '../../domain/entities/area-downtime.entity';
import {
  AreaDowntimeResponseDto,
  DowntimeEventDto,
} from '../dtos/area-downtime-response.dto';
import { TypeOrmAreaDowntimeEventRepository } from '../../domain/repositories/typeorm-area-downtime-event.repository';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';

@Injectable()
export class AreaDowntimeMappingService {
  constructor(
    private readonly areaDowntimeEventRepository: TypeOrmAreaDowntimeEventRepository,
    private readonly eventRepository: TypeOrmEventRepository
  ) {}

  async enrichDowntimeWithEvents(
    downtime: AreaDowntime
  ): Promise<AreaDowntimeResponseDto> {
    const relatedEvents =
      await this.areaDowntimeEventRepository.findByAreaDowntimeId(downtime.id);

    const eventsWithDetails = await Promise.all(
      relatedEvents.map(async relation => {
        const event = await this.eventRepository.findById(relation.eventId);
        return event;
      })
    );

    const validEvents = eventsWithDetails.filter(event => event !== null);

    const downtimeData = {
      ...downtime,
      events: validEvents,
    };

    return plainToInstance(AreaDowntimeResponseDto, downtimeData, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  async enrichDowntimesWithEvents(
    downtimes: AreaDowntime[]
  ): Promise<AreaDowntimeResponseDto[]> {
    return Promise.all(
      downtimes.map(downtime => this.enrichDowntimeWithEvents(downtime))
    );
  }

  transformEventsToDto(events: unknown[]): DowntimeEventDto[] {
    return plainToInstance(DowntimeEventDto, events, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }
}

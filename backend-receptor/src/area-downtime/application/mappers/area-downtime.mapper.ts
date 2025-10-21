import { plainToInstance } from 'class-transformer';
import type { AreaDowntime } from '../../domain/entities/area-downtime.entity';
import {
  AreaDowntimeResponseDto,
  DowntimeEventDto,
} from '../dtos/area-downtime-response.dto';

export class AreaDowntimeMapper {
  static toResponseDto(
    downtime: AreaDowntime,
    events: unknown[] = []
  ): AreaDowntimeResponseDto {
    const downtimeData = {
      ...downtime,
      events: events.map(event =>
        plainToInstance(DowntimeEventDto, event, {
          excludeExtraneousValues: true,
          enableImplicitConversion: true,
        })
      ),
    };

    return plainToInstance(AreaDowntimeResponseDto, downtimeData, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }

  static toResponseDtoArray(
    downtimes: AreaDowntime[],
    eventsMap = new Map<number, unknown[]>()
  ): AreaDowntimeResponseDto[] {
    return downtimes.map(downtime =>
      this.toResponseDto(downtime, eventsMap.get(downtime.id) ?? [])
    );
  }

  static toEventDtoArray(events: unknown[]): DowntimeEventDto[] {
    return plainToInstance(DowntimeEventDto, events, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });
  }
}

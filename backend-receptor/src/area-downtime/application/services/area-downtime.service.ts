import { Injectable, Logger } from '@nestjs/common';
import { TypeOrmAreaDowntimeRepository } from '../../domain/repositories/typeorm-area-downtime.repository';
import { TypeOrmAreaDowntimeEventRepository } from '../../domain/repositories/typeorm-area-downtime-event.repository';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { EventStatus } from '../../../events/domain/entities/event.entity';
import type { AreaDowntime } from '../../domain/entities/area-downtime.entity';
import type { Event } from '../../../events/domain/entities/event.entity';
import type { AreaDowntimeEvent } from '../../domain/entities/area-downtime-event.entity';
import type { AreaDowntimeFilters } from '../../domain/repositories/area-downtime.repository';
import type {
  AreaDowntimeResponse,
  DowntimeEvent,
} from '../types/area-downtime.types';

@Injectable()
export class AreaDowntimeService {
  private readonly logger = new Logger(AreaDowntimeService.name);

  constructor(
    private readonly areaDowntimeRepository: TypeOrmAreaDowntimeRepository,
    private readonly areaDowntimeEventRepository: TypeOrmAreaDowntimeEventRepository,
    private readonly eventRepository: TypeOrmEventRepository
  ) {}

  async handleEventForAreaDowntime(event: Event): Promise<void> {
    try {
      this.logger.log(
        `Handling downtime logic for event ${event.id} in area ${event.areaId}`
      );

      const activeEvents = await this.getActiveEventsForArea(event.areaId);

      if (event.status === EventStatus.CLOSED) {
        await this.handleEventClosed(event);
      } else {
        await this.handleActiveEvent(event, activeEvents);
      }
    } catch (error) {
      this.logger.error(
        `Error handling area downtime for event ${event.id}: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private async handleEventClosed(event: Event): Promise<void> {
    const activeDowntime = await this.areaDowntimeRepository.findActiveByAreaId(
      event.areaId
    );

    if (!activeDowntime) {
      return;
    }

    this.logger.log(
      `Event ${event.id} closed but keeping relation to downtime ${activeDowntime.id} for historical record`
    );

    const remainingActiveEvents = await this.getActiveEventsForArea(
      event.areaId
    );

    if (remainingActiveEvents.length === 0) {
      await this.endAreaDowntime(activeDowntime.id);
    }
  }

  private async handleActiveEvent(
    event: Event,
    activeEvents: Event[]
  ): Promise<void> {
    const activeDowntime = await this.areaDowntimeRepository.findActiveByAreaId(
      event.areaId
    );

    if (!activeDowntime) {
      const otherActiveEvents = activeEvents.filter(
        eventItem => eventItem.id !== event.id
      );

      await this.startAreaDowntime(event, otherActiveEvents);
    } else {
      const relation = await this.areaDowntimeEventRepository.findRelation(
        activeDowntime.id,
        event.id
      );

      if (!relation) {
        await this.areaDowntimeEventRepository.create({
          areaDowntimeId: activeDowntime.id,
          eventId: event.id,
        });

        this.logger.log(
          `Added event ${event.id} to existing downtime ${activeDowntime.id}`
        );
      }
    }
  }

  private async startAreaDowntime(
    triggeringEvent: Event,
    existingActiveEvents: Event[] = []
  ): Promise<AreaDowntime> {
    const areaDowntime = await this.areaDowntimeRepository.create({
      areaId: triggeringEvent.areaId,
      startAt: new Date(),
      isActive: true,
    });

    const allEvents = [triggeringEvent, ...existingActiveEvents];

    for (const event of allEvents) {
      await this.areaDowntimeEventRepository.create({
        areaDowntimeId: areaDowntime.id,
        eventId: event.id,
      });
    }

    this.logger.log(
      `Started downtime ${areaDowntime.id} for area ${triggeringEvent.areaId} with ${allEvents.length} events`
    );

    return areaDowntime;
  }

  private async endAreaDowntime(downtimeId: number): Promise<void> {
    await this.areaDowntimeRepository.update(downtimeId, {
      isActive: false,
      endsAt: new Date(),
    });

    this.logger.log(`Ended downtime ${downtimeId}`);
  }

  private async getActiveEventsForArea(areaId: number): Promise<Event[]> {
    return this.eventRepository.findActiveByArea(areaId);
  }

  async isAreaInDowntime(areaId: number): Promise<boolean> {
    const activeDowntime =
      await this.areaDowntimeRepository.findActiveByAreaId(areaId);
    return !!activeDowntime;
  }

  async getActiveDowntimeForArea(areaId: number): Promise<AreaDowntime | null> {
    return this.areaDowntimeRepository.findActiveByAreaId(areaId);
  }

  async getActiveDowntimeForAreaWithEvents(
    areaId: number
  ): Promise<AreaDowntimeResponse | null> {
    const activeDowntime =
      await this.areaDowntimeRepository.findActiveByAreaId(areaId);

    if (!activeDowntime) {
      return null;
    }

    return this.transformDowntimeToResponse(activeDowntime);
  }

  async getDowntimeHistoryForArea(
    areaId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ data: AreaDowntime[]; total: number }> {
    const filters: AreaDowntimeFilters = {
      areaId,
      limit,
      offset,
    };

    const { data } = await this.areaDowntimeRepository.findAll(filters);
    const total = await this.areaDowntimeRepository.count({ areaId });

    return {
      data,
      total,
    };
  }

  async startDowntime(
    areaId: number,
    relatedEventIds: number[] = []
  ): Promise<AreaDowntime> {
    const areaDowntime = await this.areaDowntimeRepository.create({
      areaId,
      startAt: new Date(),
      isActive: true,
    });

    for (const eventId of relatedEventIds) {
      await this.areaDowntimeEventRepository.create({
        areaDowntimeId: areaDowntime.id,
        eventId,
      });
    }

    this.logger.log(
      `Manually started downtime ${areaDowntime.id} for area ${areaId} with ${relatedEventIds.length} events`
    );

    return areaDowntime;
  }

  async startDowntimeWithEvents(
    areaId: number,
    relatedEventIds: number[] = []
  ): Promise<AreaDowntimeResponse> {
    const areaDowntime = await this.startDowntime(areaId, relatedEventIds);
    return this.transformDowntimeToResponse(areaDowntime);
  }

  async endDowntime(areaId: number): Promise<boolean> {
    const activeDowntime =
      await this.areaDowntimeRepository.findActiveByAreaId(areaId);

    if (!activeDowntime) {
      return false;
    }

    await this.endAreaDowntime(activeDowntime.id);
    return true;
  }

  async getRelatedEventsForDowntime(
    downtimeId: number
  ): Promise<DowntimeEvent[]> {
    const relatedEvents =
      await this.areaDowntimeEventRepository.findByAreaDowntimeId(downtimeId);

    const eventsWithDetails = await Promise.all(
      relatedEvents.map(async relation => {
        const event = await this.eventRepository.findById(relation.eventId);
        return event;
      })
    );

    return eventsWithDetails
      .filter((event): event is Event => event !== null)
      .map(event => this.transformEventToDowntimeEvent(event));
  }

  async getDowntimeForEvent(eventId: number): Promise<AreaDowntimeEvent[]> {
    return this.areaDowntimeEventRepository.findByEventId(eventId);
  }

  async getDowntimeForEventWithEvents(
    eventId: number
  ): Promise<AreaDowntimeResponse[]> {
    const downtimeEvents =
      await this.areaDowntimeEventRepository.findByEventId(eventId);

    const downtimeIds = [
      ...new Set(downtimeEvents.map(de => de.areaDowntimeId)),
    ];

    const downtimes = await Promise.all(
      downtimeIds.map(async id => {
        const downtime = await this.areaDowntimeRepository.findById(id);
        if (!downtime) return null;
        return this.transformDowntimeToResponse(downtime);
      })
    );

    return downtimes.filter(
      (downtime): downtime is AreaDowntimeResponse => downtime !== null
    );
  }

  async getAllEventsForDowntime(downtimeId: number): Promise<DowntimeEvent[]> {
    const relatedEvents =
      await this.areaDowntimeEventRepository.findByAreaDowntimeId(downtimeId);

    const eventsWithDetails = await Promise.all(
      relatedEvents.map(async relation => {
        const event = await this.eventRepository.findById(relation.eventId);
        return event;
      })
    );

    return eventsWithDetails
      .filter((event): event is Event => event !== null)
      .map(event => this.transformEventToDowntimeEvent(event));
  }

  private transformDowntimeToResponse(
    downtime: AreaDowntime
  ): Promise<AreaDowntimeResponse> {
    return this.getRelatedEventsForDowntime(downtime.id).then(events => ({
      id: downtime.id,
      areaId: downtime.areaId,
      areaName: downtime.area?.name ?? 'Unknown Area',
      startAt: downtime.startAt,
      isActive: downtime.isActive,
      endsAt: downtime.endsAt,
      events,
    }));
  }

  async getAllAreaDowntimesWithEvents(
    filters: AreaDowntimeFilters
  ): Promise<{ data: AreaDowntimeResponse[]; total: number }> {
    const { data } = await this.areaDowntimeRepository.findAll(filters);
    const total = await this.areaDowntimeRepository.count(filters);

    const formattedData = await Promise.all(
      data.map(async (downtime: AreaDowntime) => {
        const relatedEvents =
          await this.areaDowntimeEventRepository.findByAreaDowntimeId(
            downtime.id
          );

        const eventsWithDetails = await Promise.all(
          relatedEvents.map(async relation => {
            const event = await this.eventRepository.findById(relation.eventId);
            return event;
          })
        );

        const validEvents = eventsWithDetails
          .filter((event): event is Event => event !== null)
          .map(event => this.transformEventToDowntimeEvent(event));

        return {
          id: downtime.id,
          areaId: downtime.areaId,
          areaName: downtime.area?.name ?? 'Unknown Area',
          startAt: downtime.startAt,
          isActive: downtime.isActive,
          endsAt: downtime.endsAt,
          events: validEvents,
        };
      })
    );

    return {
      data: formattedData,
      total,
    };
  }

  private transformEventToDowntimeEvent(event: Event): DowntimeEvent {
    return {
      id: event.id,
      departmentId: event.departmentId,
      departmentName: event.department?.name ?? 'Unknown Department',
      deviceId: event.deviceId,
      deviceName: event.device?.name ?? 'Unknown Device',
      deviceSignalId: event.deviceSignalId,
      deviceSignalName: event.deviceSignal?.name ?? 'Unknown Signal',
      status: event.status,
      createdAt: event.createdAt,
      inProgressAt: event.inProgressAt,
      closedAt: event.closedAt,
    };
  }
}

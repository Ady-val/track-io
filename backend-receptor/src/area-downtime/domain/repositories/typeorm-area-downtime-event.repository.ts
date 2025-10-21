import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaDowntimeEvent } from '../entities/area-downtime-event.entity';
import {
  AreaDowntimeEventRepository,
  CreateAreaDowntimeEventDto,
  AreaDowntimeEventFilters,
} from './area-downtime-event.repository';

@Injectable()
export class TypeOrmAreaDowntimeEventRepository
  implements AreaDowntimeEventRepository
{
  constructor(
    @InjectRepository(AreaDowntimeEvent)
    private readonly repository: Repository<AreaDowntimeEvent>
  ) {}

  async create(dto: CreateAreaDowntimeEventDto): Promise<AreaDowntimeEvent> {
    const areaDowntimeEvent = this.repository.create(dto);
    return await this.repository.save(areaDowntimeEvent);
  }

  async findById(id: number): Promise<AreaDowntimeEvent | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['areaDowntime', 'event'],
    });
  }

  async findByAreaDowntimeId(
    areaDowntimeId: number
  ): Promise<AreaDowntimeEvent[]> {
    return await this.repository.find({
      where: { areaDowntimeId },
      relations: ['event'],
      order: { addedAt: 'ASC' },
    });
  }

  async findByEventId(eventId: number): Promise<AreaDowntimeEvent[]> {
    return await this.repository.find({
      where: { eventId },
      relations: ['areaDowntime'],
    });
  }

  async findRelation(
    areaDowntimeId: number,
    eventId: number
  ): Promise<AreaDowntimeEvent | null> {
    return await this.repository.findOne({
      where: { areaDowntimeId, eventId },
      relations: ['areaDowntime', 'event'],
    });
  }

  async findAll(
    filters: AreaDowntimeEventFilters = {}
  ): Promise<{ data: AreaDowntimeEvent[]; total: number }> {
    const queryBuilder =
      this.repository.createQueryBuilder('areaDowntimeEvent');

    if (filters.areaDowntimeId) {
      queryBuilder.andWhere(
        'areaDowntimeEvent.areaDowntimeId = :areaDowntimeId',
        {
          areaDowntimeId: filters.areaDowntimeId,
        }
      );
    }

    if (filters.eventId) {
      queryBuilder.andWhere('areaDowntimeEvent.eventId = :eventId', {
        eventId: filters.eventId,
      });
    }

    queryBuilder.orderBy('areaDowntimeEvent.addedAt', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .leftJoinAndSelect('areaDowntimeEvent.areaDowntime', 'areaDowntime')
      .leftJoinAndSelect('areaDowntimeEvent.event', 'event')
      .take(filters.limit ?? 10)
      .skip(filters.offset ?? 0)
      .getMany();

    return { data, total };
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteByAreaDowntimeId(areaDowntimeId: number): Promise<void> {
    await this.repository.delete({ areaDowntimeId });
  }

  async deleteByEventId(eventId: number): Promise<void> {
    await this.repository.delete({ eventId });
  }

  async count(filters: AreaDowntimeEventFilters = {}): Promise<number> {
    const queryBuilder =
      this.repository.createQueryBuilder('areaDowntimeEvent');

    if (filters.areaDowntimeId) {
      queryBuilder.andWhere(
        'areaDowntimeEvent.areaDowntimeId = :areaDowntimeId',
        {
          areaDowntimeId: filters.areaDowntimeId,
        }
      );
    }

    if (filters.eventId) {
      queryBuilder.andWhere('areaDowntimeEvent.eventId = :eventId', {
        eventId: filters.eventId,
      });
    }

    return queryBuilder.getCount();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type DeepPartial } from 'typeorm';
import { EventAlertLog } from '../entities/event-alert-log.entity';
import { AlertLevel } from '../entities/alert-escalation-message.entity';

export interface CreateEventAlertLogDto {
  eventId: number;
  level: AlertLevel;
  sentAt: Date;
  messagesSent: unknown[];
  success: boolean;
  errorMessage?: string;
  endpointUrl: string;
}

@Injectable()
export class EventAlertLogRepository {
  constructor(
    @InjectRepository(EventAlertLog)
    private readonly repository: Repository<EventAlertLog>
  ) {}

  async create(dto: CreateEventAlertLogDto): Promise<EventAlertLog> {
    const log = this.repository.create(dto as DeepPartial<EventAlertLog>);
    const result = await this.repository.save(log);
    return Array.isArray(result) ? result[0]! : result;
  }

  async findById(id: number): Promise<EventAlertLog | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['event'],
    });
  }

  async findByEvent(eventId: number): Promise<EventAlertLog[]> {
    return await this.repository.find({
      where: { eventId },
      relations: ['event'],
      order: { sentAt: 'DESC' },
    });
  }

  async findByEventAndLevel(
    eventId: number,
    level: AlertLevel
  ): Promise<EventAlertLog | null> {
    return await this.repository.findOne({
      where: { eventId, level },
      relations: ['event'],
    });
  }

  async findByLevel(level: AlertLevel): Promise<EventAlertLog[]> {
    return await this.repository.find({
      where: { level },
      relations: ['event'],
      order: { sentAt: 'DESC' },
    });
  }

  async findSuccessfulByEvent(eventId: number): Promise<EventAlertLog[]> {
    return await this.repository.find({
      where: { eventId, success: true },
      relations: ['event'],
      order: { sentAt: 'DESC' },
    });
  }

  async findFailedByEvent(eventId: number): Promise<EventAlertLog[]> {
    return await this.repository.find({
      where: { eventId, success: false },
      relations: ['event'],
      order: { sentAt: 'DESC' },
    });
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }

  async countByEvent(eventId: number): Promise<number> {
    return await this.repository.count({ where: { eventId } });
  }

  async countByLevel(level: AlertLevel): Promise<number> {
    return await this.repository.count({ where: { level } });
  }
}

import { Injectable } from '@nestjs/common';
import { EventAlertLogRepository } from '../../domain/repositories/event-alert-log.repository';
import { AlertLevel } from '../../domain/entities/alert-escalation-message.entity';

@Injectable()
export class EventAlertLogService {
  constructor(
    private readonly eventAlertLogRepository: EventAlertLogRepository
  ) {}

  async findAll() {
    return await this.eventAlertLogRepository.findByEvent(0);
  }

  async findById(id: number) {
    return await this.eventAlertLogRepository.findById(id);
  }

  async findByEvent(eventId: number) {
    return await this.eventAlertLogRepository.findByEvent(eventId);
  }

  async findByEventAndLevel(eventId: number, level: AlertLevel) {
    return await this.eventAlertLogRepository.findByEventAndLevel(
      eventId,
      level
    );
  }

  async findSuccessfulByEvent(eventId: number) {
    return await this.eventAlertLogRepository.findSuccessfulByEvent(eventId);
  }

  async findFailedByEvent(eventId: number) {
    return await this.eventAlertLogRepository.findFailedByEvent(eventId);
  }

  async findByLevel(level: AlertLevel) {
    return await this.eventAlertLogRepository.findByLevel(level);
  }

  async count() {
    return await this.eventAlertLogRepository.count();
  }

  async countByEvent(eventId: number) {
    return await this.eventAlertLogRepository.countByEvent(eventId);
  }

  async countByLevel(level: AlertLevel) {
    return await this.eventAlertLogRepository.countByLevel(level);
  }
}

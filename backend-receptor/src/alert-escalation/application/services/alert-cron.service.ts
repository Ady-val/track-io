import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { AlertEscalationService } from './alert-escalation.service';
import { Event } from '../../../events/domain/entities/event.entity';

@Injectable()
export class AlertCronService {
  private readonly logger = new Logger(AlertCronService.name);

  constructor(
    private readonly eventRepository: TypeOrmEventRepository,
    private readonly alertEscalationService: AlertEscalationService
  ) {}

  @Cron('* * * * * *')
  async processOpenEvents(): Promise<void> {
    try {
      const openEvents = await this.eventRepository.findOpenEvents();

      for (const event of openEvents) {
        await this.processEventEscalation(event);
      }
    } catch (error) {
      this.logger.error(
        'Error processing open events:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async processEventEscalation(event: Event): Promise<void> {
    try {
      const config =
        await this.alertEscalationService.findConfigByDeviceAndSignal(
          event.deviceId,
          event.deviceSignalId
        );

      if (!config) {
        return;
      }

      const timeElapsedMinutes = Math.floor(
        (new Date().getTime() - event.createdAt.getTime()) / (1000 * 60)
      );

      const levelToSend = this.alertEscalationService.determineLevelToSend(
        timeElapsedMinutes,
        config
      );

      if (levelToSend) {
        await this.alertEscalationService.sendAlertForLevel(
          event,
          config,
          levelToSend
        );
      }
    } catch (error) {
      this.logger.error(`Error processing event ${event.id}:`, error);
    }
  }

  async processClosedEvent(event: Event): Promise<void> {
    try {
      this.logger.log(
        `🔄 PROCESSING CLOSED EVENT: ${event.id} for device ${event.deviceId}, signal ${event.deviceSignalId}`
      );
      const config =
        await this.alertEscalationService.findConfigByDeviceAndSignal(
          event.deviceId,
          event.deviceSignalId
        );

      if (!config) {
        this.logger.warn(
          `No escalation config found for device ${event.deviceId}, signal ${event.deviceSignalId}`
        );
        return;
      }

      this.logger.log(
        `✅ Found escalation config ${config.id} for closed event ${event.id}`
      );
      await this.alertEscalationService.sendCloseEventAlert(event, config);
    } catch (error) {
      this.logger.error(`Error processing closed event ${event.id}:`, error);
    }
  }
}

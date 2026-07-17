import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { AlertEscalationService } from './alert-escalation.service';
import { Event } from '../../../events/domain/entities/event.entity';
import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';

@Injectable()
export class AlertCronService {
  private readonly logger = new Logger(AlertCronService.name);

  constructor(
    private readonly eventRepository: TypeOrmEventRepository,
    private readonly alertEscalationService: AlertEscalationService,
    private readonly scheduledDowntimeCalculatorService: ScheduledDowntimeCalculatorService
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

      // D1 (PLAN §1.6.5): el reloj de escalamiento cuenta MINUTOS PRODUCTIVOS,
      // no minutos de reloj. Si la línea cae a las 12:40, el umbral es de 30 min
      // y hay un paro programado de 13:00 a 14:00, el escalamiento NO sale a las
      // 13:10 (30 min de reloj, pero solo 20 productivos): sale a las 14:10.
      //
      // El catálogo viene de una caché en memoria porque este cron corre CADA
      // SEGUNDO; sin ella serían N consultas/seg contra la BD (PLAN §1.8.3).
      const timeElapsedMinutes = await this.getProductiveElapsedMinutes(event);

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

  /**
   * Minutos productivos transcurridos desde que se abrió el evento, es decir,
   * descontando el tiempo cubierto por paros programados del área.
   *
   * Degradación segura: si el cálculo falla, se usa el reloj de pared. Es el
   * comportamiento previo a esta fase — escalar de más es preferible a no
   * escalar cuando la línea está caída de verdad.
   */
  private async getProductiveElapsedMinutes(event: Event): Promise<number> {
    const now = new Date();

    try {
      const productiveSeconds =
        await this.scheduledDowntimeCalculatorService.getEffectiveSeconds(
          event.areaId,
          event.createdAt,
          now
        );

      return Math.floor(productiveSeconds / 60);
    } catch (error) {
      this.logger.error(
        `Fallo al calcular minutos productivos del evento ${event.id}; ` +
          `se usa el reloj de pared: ${(error as Error).message}`
      );

      return Math.floor(
        (now.getTime() - event.createdAt.getTime()) / (1000 * 60)
      );
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

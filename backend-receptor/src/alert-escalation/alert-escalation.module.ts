import { Module } from '@nestjs/common';
import { ScheduledDowntimesModule } from '../scheduled-downtimes/scheduled-downtimes.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

import { AlertEscalationConfig } from './domain/entities/alert-escalation-config.entity';
import { AlertEscalationMessage } from './domain/entities/alert-escalation-message.entity';
import { EventAlertLog } from './domain/entities/event-alert-log.entity';

import { AlertEscalationConfigRepository } from './domain/repositories/alert-escalation-config.repository';
import { AlertEscalationMessageRepository } from './domain/repositories/alert-escalation-message.repository';
import { EventAlertLogRepository } from './domain/repositories/event-alert-log.repository';

import { AlertEscalationService } from './application/services/alert-escalation.service';
import { AlertCronService } from './application/services/alert-cron.service';
import { AlertEscalationConfigService } from './application/services/alert-escalation-config.service';
import { AlertEscalationMessageService } from './application/services/alert-escalation-message.service';
import { EventAlertLogService } from './application/services/event-alert-log.service';

import { AlertEscalationConfigController } from './controllers/alert-escalation-config.controller';
import { AlertEscalationMessageController } from './controllers/alert-escalation-message.controller';
import { EventAlertLogController } from './controllers/event-alert-log.controller';

import { EventsModule } from '../events/events.module';
import { Event } from '../events/domain/entities/event.entity';

@Module({
  imports: [
    ScheduledDowntimesModule,
    TypeOrmModule.forFeature([
      AlertEscalationConfig,
      AlertEscalationMessage,
      EventAlertLog,
      Event,
    ]),
    EventsModule,
    HttpModule,
  ],
  providers: [
    AlertEscalationConfigRepository,
    AlertEscalationMessageRepository,
    EventAlertLogRepository,

    AlertEscalationService,
    AlertCronService,
    AlertEscalationConfigService,
    AlertEscalationMessageService,
    EventAlertLogService,
  ],
  controllers: [
    AlertEscalationConfigController,
    AlertEscalationMessageController,
    EventAlertLogController,
  ],
  exports: [
    AlertEscalationService,
    AlertCronService,
    AlertEscalationConfigService,
    AlertEscalationMessageService,
    EventAlertLogService,
  ],
})
export class AlertEscalationModule {}

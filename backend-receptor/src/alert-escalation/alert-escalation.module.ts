import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';

// Entities
import { AlertEscalationConfig } from './domain/entities/alert-escalation-config.entity';
import { AlertEscalationMessage } from './domain/entities/alert-escalation-message.entity';
import { EventAlertLog } from './domain/entities/event-alert-log.entity';

// Repositories
import { AlertEscalationConfigRepository } from './domain/repositories/alert-escalation-config.repository';
import { AlertEscalationMessageRepository } from './domain/repositories/alert-escalation-message.repository';
import { EventAlertLogRepository } from './domain/repositories/event-alert-log.repository';

// Services
import { AlertEscalationService } from './application/services/alert-escalation.service';
import { AlertCronService } from './application/services/alert-cron.service';
import { AlertEscalationConfigService } from './application/services/alert-escalation-config.service';
import { AlertEscalationMessageService } from './application/services/alert-escalation-message.service';
import { EventAlertLogService } from './application/services/event-alert-log.service';

// Controllers
import { AlertEscalationConfigController } from './controllers/alert-escalation-config.controller';
import { AlertEscalationMessageController } from './controllers/alert-escalation-message.controller';
import { EventAlertLogController } from './controllers/event-alert-log.controller';

// External dependencies
import { TypeOrmEventRepository } from '../events/domain/repositories/typeorm-event.repository';
import { Event } from '../events/domain/entities/event.entity';
import { TorretaColorsModule } from '../torreta-colors/torreta-colors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AlertEscalationConfig,
      AlertEscalationMessage,
      EventAlertLog,
      Event,
    ]),
    HttpModule,
    TorretaColorsModule,
  ],
  providers: [
    // Repositories
    AlertEscalationConfigRepository,
    AlertEscalationMessageRepository,
    EventAlertLogRepository,
    TypeOrmEventRepository,

    // Services
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

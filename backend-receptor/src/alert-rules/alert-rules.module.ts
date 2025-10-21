import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertRule } from './domain/entities/alert-rule.entity';
import { AlertRuleRepository } from './domain/repositories/alert-rule.repository';
import { AlertRuleService } from './application/services/alert-rule.service';
import { AlertEvaluationService } from './application/services/alert-evaluation.service';
import { AlertRuleController } from './controllers/alert-rule.controller';
import { MeasurementsModule } from '../measurements/measurements.module';
import { AlertTriggersModule } from '../alert-triggers/alert-triggers.module';
import { AlertMessagesModule } from '../alert-messages/alert-messages.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlertRule]),
    MeasurementsModule,
    forwardRef(() => AlertTriggersModule),
    forwardRef(() => AlertMessagesModule),
    WebSocketModule,
  ],
  controllers: [AlertRuleController],
  providers: [AlertRuleService, AlertRuleRepository, AlertEvaluationService],
  exports: [AlertRuleService, AlertRuleRepository, AlertEvaluationService],
})
export class AlertRulesModule {}

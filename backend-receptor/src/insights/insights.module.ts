import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsightsController } from './controllers/insights.controller';
import { InsightsService } from './application/services/insights.service';
import { EventInsightsAggregator } from './application/services/event-insights-aggregator.service';
import { AnthropicInsightsClient } from './application/services/anthropic-insights.client';
import { InsightAnalysisCacheRepository } from './domain/repositories/insight-analysis-cache.repository';
import { InsightAnalysisCache } from './domain/entities/insight-analysis-cache.entity';
import { Event } from '../events/domain/entities/event.entity';
import { EventAlertLog } from '../alert-escalation/domain/entities/event-alert-log.entity';
import { ScheduledDowntimesModule } from '../scheduled-downtimes/scheduled-downtimes.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventAlertLog, InsightAnalysisCache]),
    ScheduledDowntimesModule,
    PermissionsModule,
  ],
  controllers: [InsightsController],
  providers: [
    InsightsService,
    EventInsightsAggregator,
    AnthropicInsightsClient,
    InsightAnalysisCacheRepository,
  ],
  exports: [InsightsService],
})
export class InsightsModule {}

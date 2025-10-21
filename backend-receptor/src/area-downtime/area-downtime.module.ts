import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaDowntime } from './domain/entities/area-downtime.entity';
import { AreaDowntimeEvent } from './domain/entities/area-downtime-event.entity';
import { AreaDowntimeService } from './application/services/area-downtime.service';
import { AreaDowntimeMappingService } from './application/services/area-downtime-mapping.service';
import { TypeOrmAreaDowntimeRepository } from './domain/repositories/typeorm-area-downtime.repository';
import { TypeOrmAreaDowntimeEventRepository } from './domain/repositories/typeorm-area-downtime-event.repository';
import { EventsModule } from '../events/events.module';
import { AreaDowntimeController } from './controllers/area-downtime.controller';
import { Event } from '../events/domain/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AreaDowntime, AreaDowntimeEvent, Event]),
    EventsModule,
  ],
  controllers: [AreaDowntimeController],
  providers: [
    AreaDowntimeService,
    AreaDowntimeMappingService,
    TypeOrmAreaDowntimeRepository,
    TypeOrmAreaDowntimeEventRepository,
  ],
  exports: [
    AreaDowntimeService,
    TypeOrmAreaDowntimeRepository,
    TypeOrmAreaDowntimeEventRepository,
  ],
})
export class AreaDowntimeModule {}

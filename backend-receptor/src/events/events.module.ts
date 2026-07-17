import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './domain/entities/event.entity';
import { EventScheduledDowntimeSlice } from './domain/entities/event-scheduled-downtime-slice.entity';
import { TypeOrmEventRepository } from './domain/repositories/typeorm-event.repository';
import { EventScheduledDowntimeSliceRepository } from './domain/repositories/event-scheduled-downtime-slice.repository';
import { EventController } from './controllers/event.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventScheduledDowntimeSlice]),
  ],
  controllers: [EventController],
  providers: [TypeOrmEventRepository, EventScheduledDowntimeSliceRepository],
  exports: [TypeOrmEventRepository, EventScheduledDowntimeSliceRepository],
})
export class EventsModule {}

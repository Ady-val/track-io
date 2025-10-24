import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './domain/entities/event.entity';
import { TypeOrmEventRepository } from './domain/repositories/typeorm-event.repository';
import { EventController } from './controllers/event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  controllers: [EventController],
  providers: [TypeOrmEventRepository],
  exports: [TypeOrmEventRepository],
})
export class EventsModule {}

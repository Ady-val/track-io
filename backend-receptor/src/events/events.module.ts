import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './domain/entities/event.entity';
import { TypeOrmEventRepository } from './domain/repositories/typeorm-event.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [TypeOrmEventRepository],
  exports: [TypeOrmEventRepository],
})
export class EventsModule {}

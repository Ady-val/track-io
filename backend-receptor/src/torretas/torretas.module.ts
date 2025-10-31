import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '../events/events.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Torreta } from './domain/entities/torreta.entity';
import { TorretaRepository } from './domain/repositories/torreta.repository';
import { TorretaService } from './application/services/torreta.service';
import { ModbusService } from './application/services/modbus.service';
import { BannerSchedulerService } from './application/services/banner-scheduler.service';
import { TorretaController } from './controllers/torreta.controller';
import { ModbusController } from './controllers/modbus.controller';

@Module({
  imports: [ConfigModule, EventsModule, TypeOrmModule.forFeature([Torreta])],
  controllers: [TorretaController, ModbusController],
  providers: [TorretaService, TorretaRepository, ModbusService, BannerSchedulerService],
  exports: [TorretaService, TorretaRepository, ModbusService],
})
export class TorretasModule {}

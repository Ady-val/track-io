import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeasurementController } from './controllers/measurement.controller';
import { MeasurementService } from './application/services/measurement.service';
import { Measurement } from './domain/entities/measurement.entity';
import { MeasurementValue } from './domain/entities/measurement-value.entity';
import { MeasurementRepository } from './domain/repositories/measurement.repository';
import { MeasurementValueRepository } from './domain/repositories/measurement-value.repository';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Measurement, MeasurementValue]),
    WebSocketModule,
  ],
  controllers: [MeasurementController],
  providers: [
    MeasurementService,
    MeasurementRepository,
    MeasurementValueRepository,
  ],
  exports: [
    MeasurementService,
    MeasurementRepository,
    MeasurementValueRepository,
  ],
})
export class MeasurementsModule {}

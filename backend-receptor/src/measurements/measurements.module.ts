import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeasurementController } from './controllers/measurement.controller';
import { MeasurementService } from './application/services/measurement.service';
import { RawMeasurement } from './domain/entities/raw-measurement.entity';
import { RawMeasurementRepository } from './domain/repositories/raw-measurement.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RawMeasurement])],
  controllers: [MeasurementController],
  providers: [MeasurementService, RawMeasurementRepository],
  exports: [MeasurementService, RawMeasurementRepository],
})
export class MeasurementsModule {}

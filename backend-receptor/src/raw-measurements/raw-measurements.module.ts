import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RawMeasurementController } from './controllers/raw-measurement.controller';
import { RawMeasurementService } from './application/services/raw-measurement.service';
import { RawMeasurement } from './domain/entities/raw-measurement.entity';
import { RawMeasurementRepository } from './domain/repositories/raw-measurement.repository';
import { MeasurementsModule } from '../measurements/measurements.module';
import { AlertRulesModule } from '../alert-rules/alert-rules.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RawMeasurement]),
    MeasurementsModule,
    forwardRef(() => AlertRulesModule),
  ],
  controllers: [RawMeasurementController],
  providers: [RawMeasurementService, RawMeasurementRepository],
  exports: [RawMeasurementService, RawMeasurementRepository],
})
export class RawMeasurementsModule {}

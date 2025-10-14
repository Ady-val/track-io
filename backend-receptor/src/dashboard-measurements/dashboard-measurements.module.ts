import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardMeasurement } from './domain/entities/dashboard-measurement.entity';
import { DashboardMeasurementRepository } from './domain/repositories/dashboard-measurement.repository';
import { DashboardMeasurementService } from './application/services/dashboard-measurement.service';
import { DashboardMeasurementController } from './controllers/dashboard-measurement.controller';
import { MeasurementsModule } from '../measurements/measurements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DashboardMeasurement]),
    MeasurementsModule,
  ],
  controllers: [DashboardMeasurementController],
  providers: [DashboardMeasurementService, DashboardMeasurementRepository],
  exports: [DashboardMeasurementService, DashboardMeasurementRepository],
})
export class DashboardMeasurementsModule {}



import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardMeasurement } from './domain/entities/dashboard-measurement.entity';
import { DashboardMeasurementGroup } from './domain/entities/dashboard-measurement-group.entity';
import { DashboardMeasurementRepository } from './domain/repositories/dashboard-measurement.repository';
import { DashboardMeasurementGroupRepository } from './domain/repositories/dashboard-measurement-group.repository';
import { DashboardMeasurementService } from './application/services/dashboard-measurement.service';
import { DashboardMeasurementGroupService } from './application/services/dashboard-measurement-group.service';
import { DashboardMeasurementController } from './controllers/dashboard-measurement.controller';
import { DashboardMeasurementGroupController } from './controllers/dashboard-measurement-group.controller';
import { MeasurementsModule } from '../measurements/measurements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DashboardMeasurement, DashboardMeasurementGroup]),
    MeasurementsModule,
  ],
  controllers: [
    DashboardMeasurementController,
    DashboardMeasurementGroupController,
  ],
  providers: [
    DashboardMeasurementService,
    DashboardMeasurementRepository,
    DashboardMeasurementGroupService,
    DashboardMeasurementGroupRepository,
  ],
  exports: [
    DashboardMeasurementService,
    DashboardMeasurementRepository,
    DashboardMeasurementGroupService,
    DashboardMeasurementGroupRepository,
  ],
})
export class DashboardMeasurementsModule {}

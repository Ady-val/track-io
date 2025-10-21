import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './application/services/dashboard.service';
import { AreasModule } from '../areas/areas.module';
import { DepartmentsModule } from '../departments/departments.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AreasModule, DepartmentsModule, EventsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DowntimeReportController } from './controllers/downtime-report.controller';
import { DowntimeReportService } from './application/services/downtime-report.service';
import { DowntimeReportExcelService } from './application/services/downtime-report-excel.service';
import { Event } from '../events/domain/entities/event.entity';
import { AreaDowntime } from '../area-downtime/domain/entities/area-downtime.entity';
import { ScheduledDowntimesModule } from '../scheduled-downtimes/scheduled-downtimes.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, AreaDowntime]),
    ScheduledDowntimesModule,
    PermissionsModule,
  ],
  controllers: [DowntimeReportController],
  providers: [DowntimeReportService, DowntimeReportExcelService],
  exports: [DowntimeReportService],
})
export class ReportsModule {}

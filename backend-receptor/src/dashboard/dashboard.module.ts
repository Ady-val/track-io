import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './application/services/dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}





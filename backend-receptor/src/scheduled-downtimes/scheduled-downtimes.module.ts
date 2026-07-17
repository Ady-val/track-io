import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledDowntimeController } from './controllers/scheduled-downtime.controller';
import { ScheduledDowntimeService } from './application/services/scheduled-downtime.service';
import { ScheduledDowntimeCalculatorService } from './application/services/scheduled-downtime-calculator.service';
import { ScheduledDowntimeCacheService } from './application/services/scheduled-downtime-cache.service';
import { ScheduledDowntimeRecalculateService } from './application/services/scheduled-downtime-recalculate.service';
import { ScheduledDowntime } from './domain/entities/scheduled-downtime.entity';
import { ScheduledDowntimeRepository } from './domain/repositories/scheduled-downtime.repository';
import { Area } from '../areas/domain/entities/area.entity';
import { AreaRepository } from '../areas/domain/repositories/area.repository';
import { Event } from '../events/domain/entities/event.entity';
import { AreaDowntime } from '../area-downtime/domain/entities/area-downtime.entity';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduledDowntime, Area, Event, AreaDowntime]),
    PermissionsModule,
  ],
  controllers: [ScheduledDowntimeController],
  providers: [
    ScheduledDowntimeService,
    ScheduledDowntimeCalculatorService,
    ScheduledDowntimeCacheService,
    ScheduledDowntimeRecalculateService,
    ScheduledDowntimeRepository,
    AreaRepository,
  ],
  // ScheduledDowntimeCalculatorService se exporta explícitamente: es la pieza
  // que Fase 2 (Reportes de disponibilidad) va a inyectar en su propio módulo.
  exports: [
    ScheduledDowntimeService,
    ScheduledDowntimeCalculatorService,
    ScheduledDowntimeCacheService,
    ScheduledDowntimeRepository,
  ],
})
export class ScheduledDowntimesModule {}

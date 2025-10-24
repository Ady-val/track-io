import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalController } from './controllers/signal.controller';
import { SignalService } from './application/services/signal.service';
import { RawSignal } from './domain/entities/raw-signal.entity';
import { ProcessedSignal } from './domain/entities/processed-signal.entity';
import { RawSignalRepository } from './domain/repositories/raw-signal.repository';
import { ProcessedSignalRepository } from './domain/repositories/processed-signal.repository';
import { DeviceRepository } from '../devices/domain/repositories/device.repository';
import { DeviceSignalRepository } from '../device-signals/domain/repositories/device-signal.repository';
import { Device } from '../devices/domain/entities/device.entity';
import { DeviceSignal } from '../device-signals/domain/entities/device-signal.entity';
// import { WebSocketModule } from '../websocket/websocket.module';
import { EventsModule } from '../events/events.module';
import { AreaDowntimeModule } from '../area-downtime/area-downtime.module';
import { AlertEscalationModule } from '../alert-escalation/alert-escalation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RawSignal,
      ProcessedSignal,
      Device,
      DeviceSignal,
    ]),
    // WebSocketModule,
    EventsModule,
    AreaDowntimeModule,
    AlertEscalationModule,
  ],
  controllers: [SignalController],
  providers: [
    SignalService,
    RawSignalRepository,
    ProcessedSignalRepository,
    DeviceRepository,
    DeviceSignalRepository,
  ],
  exports: [SignalService, RawSignalRepository, ProcessedSignalRepository],
})
export class SignalsModule {}

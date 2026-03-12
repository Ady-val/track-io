import { Module } from '@nestjs/common';
import { AreaDowntimeModule } from '../area-downtime/area-downtime.module';
import { DevicesModule } from '../devices/devices.module';
import { DepartmentsModule } from '../departments/departments.module';
import { EventsModule } from '../events/events.module';
import { SignalsModule } from '../signals/signals.module';
import { VirtualDeviceController } from './controllers/virtual-device.controller';

@Module({
  imports: [
    AreaDowntimeModule,
    DevicesModule,
    DepartmentsModule,
    EventsModule,
    SignalsModule,
  ],
  controllers: [VirtualDeviceController],
})
export class VirtualDeviceModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceSignalController } from './controllers/device-signal.controller';
import { DeviceSignalService } from './application/services/device-signal.service';
import { DeviceSignal } from './domain/entities/device-signal.entity';
import { DeviceSignalRepository } from './domain/repositories/device-signal.repository';
import { DeviceRepository } from '../devices/domain/repositories/device.repository';
import { DepartmentRepository } from '../departments/domain/repositories/department.repository';
import { Device } from '../devices/domain/entities/device.entity';
import { Department } from '../departments/domain/entities/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceSignal, Device, Department])],
  controllers: [DeviceSignalController],
  providers: [
    DeviceSignalService,
    DeviceSignalRepository,
    DeviceRepository,
    DepartmentRepository,
  ],
  exports: [DeviceSignalService, DeviceSignalRepository],
})
export class DeviceSignalsModule {}

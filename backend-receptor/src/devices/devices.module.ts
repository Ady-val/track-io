import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceController } from './controllers/device.controller';
import { DeviceService } from './application/services/device.service';
import { Device } from './domain/entities/device.entity';
import { DeviceRepository } from './domain/repositories/device.repository';
import { AreaRepository } from '../areas/domain/repositories/area.repository';
import { Area } from '../areas/domain/entities/area.entity';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Area]), PermissionsModule],
  controllers: [DeviceController],
  providers: [DeviceService, DeviceRepository, AreaRepository],
  exports: [DeviceService, DeviceRepository],
})
export class DevicesModule {}

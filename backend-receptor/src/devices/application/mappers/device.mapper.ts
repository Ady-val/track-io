import type { Device } from '../../domain/entities/device.entity';
import type {
  DeviceResponseDto,
  DeviceSignalResponseDto,
} from '../dtos/device-response.dto';

export class DeviceMapper {
  static toResponseDto(device: Device): DeviceResponseDto {
    const deviceSignals: DeviceSignalResponseDto[] =
      device.deviceSignals?.map(signal => ({
        id: signal.id,
        name: signal.name,
        departmentId: signal.departmentId,
        departmentName: signal.department?.name ?? '',
        externalValueId: signal.externalValueId,
      })) ?? [];

    return {
      id: device.id,
      name: device.name,
      areaId: device.areaId,
      areaName: device.area?.name ?? '',
      externalId: device.externalId,
      deviceSignals,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }

  static toResponseDtoArray(devices: Device[]): DeviceResponseDto[] {
    return devices.map(device => this.toResponseDto(device));
  }
}

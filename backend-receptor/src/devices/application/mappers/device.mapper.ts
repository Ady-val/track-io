import type { Device } from '../../domain/entities/device.entity';
import type {
  DeviceResponseDto,
  DeviceSignalResponseDto,
} from '../dtos/device-response.dto';

export class DeviceMapper {
  static toResponseDto(device: Device): DeviceResponseDto {
    // Filter out null/undefined signals and signals without id (empty objects from leftJoin)
    // When leftJoinAndSelect with condition doesn't match, TypeORM can create empty objects
    const deviceSignals: DeviceSignalResponseDto[] =
      device.deviceSignals
        ?.filter(signal => {
          // Check if signal exists and has valid id (not null, not undefined, not empty object)
          return (
            signal?.id != null &&
            signal.id !== undefined &&
            typeof signal.id === 'number' &&
            !isNaN(signal.id)
          );
        })
        ?.map(signal => ({
          id: signal.id,
          name: signal.name || '',
          departmentId: signal.departmentId,
          departmentName: signal.department?.name ?? '',
          externalValueId: signal.externalValueId || '',
        })) ?? [];

    return {
      id: device.id,
      name: device.name,
      areaId: device.areaId,
      areaName: device.area?.name ?? '',
      externalId: device.externalId,
      isVirtualDevice: device.isVirtualDevice,
      deviceSignals,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }

  static toResponseDtoArray(devices: Device[]): DeviceResponseDto[] {
    return devices.map(device => this.toResponseDto(device));
  }
}

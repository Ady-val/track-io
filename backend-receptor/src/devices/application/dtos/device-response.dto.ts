export class DeviceSignalResponseDto {
  id!: number;
  name!: string;
  departmentId!: number;
  departmentName!: string;
  externalValueId!: string;
}

export class DeviceResponseDto {
  id!: number;
  name!: string;
  areaId!: number;
  areaName!: string;
  externalId!: string;
  deviceSignals!: DeviceSignalResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

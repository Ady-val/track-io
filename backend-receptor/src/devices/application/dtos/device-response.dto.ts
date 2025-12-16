import { Exclude, Expose, Type } from 'class-transformer';

@Expose()
export class DeviceSignalResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  departmentId!: number;

  @Expose()
  departmentName!: string;

  @Expose()
  externalValueId!: string;
}

@Expose()
export class DeviceResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  areaId!: number;

  @Expose()
  areaName!: string;

  @Expose()
  externalId!: string;

  @Expose()
  isVirtualDevice!: boolean;

  @Expose()
  @Type(() => DeviceSignalResponseDto)
  deviceSignals!: DeviceSignalResponseDto[];

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;
}

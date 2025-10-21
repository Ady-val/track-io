import { Expose, Transform, Type } from 'class-transformer';

export class AreaDowntimeResponseDto {
  @Expose()
  id!: number;

  @Expose()
  areaId!: number;

  @Expose()
  @Transform(
    ({ obj }: { obj: { area?: { name?: string } } }) =>
      obj.area?.name ?? 'Unknown Area'
  )
  areaName!: string;

  @Expose()
  startAt!: Date;

  @Expose()
  isActive!: boolean;

  @Expose()
  endsAt?: Date;

  @Expose()
  @Type(() => DowntimeEventDto)
  events: DowntimeEventDto[] = [];
}

export class DowntimeEventDto {
  @Expose()
  id!: number;

  @Expose()
  departmentId!: number;

  @Expose()
  departmentName!: string;

  @Expose()
  deviceId!: number;

  @Expose()
  deviceName!: string;

  @Expose()
  deviceSignalId!: number;

  @Expose()
  deviceSignalName!: string;

  @Expose()
  status!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  inProgressAt?: Date;

  @Expose()
  closedAt?: Date;
}

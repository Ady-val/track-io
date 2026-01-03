import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { MeasurementType } from '../../domain/entities/measurement.entity';

export class CreateMeasurementDto {
  @IsString()
  @IsNotEmpty()
  externalId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(MeasurementType, {
    message: 'type must be one of the following values: temperature, humidity, pressure, level, flow, vibration, status',
  })
  @IsNotEmpty()
  type!: MeasurementType;
}

export class UpdateMeasurementDto {
  @IsString()
  @IsOptional()
  externalId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(MeasurementType, {
    message: 'type must be one of the following values: temperature, humidity, pressure, level, flow, vibration, status',
  })
  @IsOptional()
  type?: MeasurementType;
}

@Expose()
export class MeasurementResponseDto {
  @Expose()
  id!: number;

  @Expose()
  externalId!: string;

  @Expose()
  name!: string;

  @Expose()
  type!: MeasurementType;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;
}

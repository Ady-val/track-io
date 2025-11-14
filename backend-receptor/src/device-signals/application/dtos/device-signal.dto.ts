import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class CreateDeviceSignalDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name!: string;

  @IsNumber({}, { message: 'deviceId must be a number' })
  @IsPositive({ message: 'deviceId must be a positive number' })
  deviceId!: number;

  @IsNumber({}, { message: 'departmentId must be a number' })
  @IsPositive({ message: 'departmentId must be a positive number' })
  departmentId!: number;

  @IsString({ message: 'externalValueId must be a string' })
  @IsNotEmpty({ message: 'externalValueId is required' })
  externalValueId!: string;
}

export class UpdateDeviceSignalDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'deviceId must be a number' })
  @IsPositive({ message: 'deviceId must be a positive number' })
  deviceId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'departmentId must be a number' })
  @IsPositive({ message: 'departmentId must be a positive number' })
  departmentId?: number;

  @IsOptional()
  @IsString({ message: 'externalValueId must be a string' })
  @IsNotEmpty({ message: 'externalValueId cannot be empty' })
  externalValueId?: string;
}

@Expose()
export class DeviceSignalResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  deviceId!: number;

  @Expose()
  departmentId!: number;

  @Expose()
  externalValueId!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;

  @Expose()
  device?: {
    id: number;
    name: string;
    areaId: number;
    externalId: string;
    area?: {
      id: number;
      name: string;
    };
  };

  @Expose()
  department?: {
    id: number;
    name: string;
  };
}

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsBoolean,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class CreateDeviceDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name!: string;

  @IsNumber({}, { message: 'areaId must be a number' })
  @IsPositive({ message: 'areaId must be a positive number' })
  areaId!: number;

  @IsString({ message: 'externalId must be a string' })
  @IsNotEmpty({ message: 'externalId is required' })
  externalId!: string;

  @IsOptional()
  @IsBoolean({ message: 'isVirtualDevice must be a boolean' })
  isVirtualDevice?: boolean;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'areaId must be a number' })
  @IsPositive({ message: 'areaId must be a positive number' })
  areaId?: number;

  @IsOptional()
  @IsString({ message: 'externalId must be a string' })
  @IsNotEmpty({ message: 'externalId cannot be empty' })
  externalId?: string;

  @IsOptional()
  @IsBoolean({ message: 'isVirtualDevice must be a boolean' })
  isVirtualDevice?: boolean;
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
  externalId!: string;

  @Expose()
  isVirtualDevice!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;

  @Expose()
  area?: {
    id: number;
    name: string;
  };
}

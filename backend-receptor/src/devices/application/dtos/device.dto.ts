import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';

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
}

export class DeviceResponseDto {
  id!: number;
  name!: string;
  areaId!: number;
  externalId!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;
  area?: {
    id: number;
    name: string;
  };
}

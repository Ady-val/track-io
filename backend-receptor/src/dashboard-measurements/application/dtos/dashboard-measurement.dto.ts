import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { MeasurementType } from '../../../measurements/domain/entities/measurement.entity';

export class CreateDashboardMeasurementDto {
  @IsInt()
  @IsNotEmpty()
  measurementId!: number;

  @IsOptional()
  @IsInt()
  groupId?: number;

  @IsNumber()
  @IsNotEmpty()
  minValue!: number;

  @IsNumber()
  @IsNotEmpty()
  maxValue!: number;
}

export class UpdateDashboardMeasurementDto {
  @IsOptional()
  @IsInt()
  measurementId?: number;

  @IsOptional()
  @IsInt()
  groupId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxValue?: number;
}

/**
 * Combined DTOs to create/update both Measurement and DashboardMeasurement
 * in a single request. This allows atomic operations from the frontend.
 */
export class CreateMeasurementWithDashboardDto {
  // Measurement fields
  @IsString()
  @IsNotEmpty()
  externalId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(MeasurementType)
  @IsNotEmpty()
  type!: MeasurementType;

  // DashboardMeasurement fields
  @IsOptional()
  @IsInt()
  @IsPositive()
  groupId?: number;

  @IsNumber()
  @IsNotEmpty()
  minValue!: number;

  @IsNumber()
  @IsNotEmpty()
  maxValue!: number;
}

export class UpdateMeasurementWithDashboardDto {
  // Measurement fields (all optional)
  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(MeasurementType)
  type?: MeasurementType;

  // DashboardMeasurement fields (all optional)
  @IsOptional()
  @ValidateIf(o => o.groupId !== null && o.groupId !== undefined)
  @IsInt()
  @IsPositive()
  groupId?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxValue?: number;
}

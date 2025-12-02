import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardMeasurementItemDto {
  @IsInt()
  @IsNotEmpty()
  measurementId!: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  minValue!: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  maxValue!: number;
}

export class CreateDashboardMeasurementGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardMeasurementItemDto)
  dashboardMeasurements!: DashboardMeasurementItemDto[];
}

export class UpdateDashboardMeasurementGroupDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardMeasurementItemDto)
  dashboardMeasurements?: DashboardMeasurementItemDto[];
}

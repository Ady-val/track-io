import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardMeasurementItemDto {
  @IsInt()
  @IsNotEmpty()
  dashboardMeasurementId!: number;
}

export class CreateDashboardMeasurementGroupDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DashboardMeasurementItemDto)
  dashboardMeasurements!: DashboardMeasurementItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 10, 30, 60, 120, 240, 480])
  chartTimeRange?: number;

  @IsOptional()
  @IsNumber()
  chartMinValue?: number;

  @IsOptional()
  @IsNumber()
  chartMaxValue?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  chartMeasurementIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 10, 30, 60, 120, 240, 480])
  chart2TimeRange?: number;

  @IsOptional()
  @IsNumber()
  chart2MinValue?: number;

  @IsOptional()
  @IsNumber()
  chart2MaxValue?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  chart2MeasurementIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  dashboardMeasurementOrder?: number[];
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 10, 30, 60, 120, 240, 480])
  chartTimeRange?: number;

  @IsOptional()
  @IsNumber()
  chartMinValue?: number;

  @IsOptional()
  @IsNumber()
  chartMaxValue?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  chartMeasurementIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 10, 30, 60, 120, 240, 480])
  chart2TimeRange?: number;

  @IsOptional()
  @IsNumber()
  chart2MinValue?: number;

  @IsOptional()
  @IsNumber()
  chart2MaxValue?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  chart2MeasurementIds?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  dashboardMeasurementOrder?: number[];
}

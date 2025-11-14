import { IsInt, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

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

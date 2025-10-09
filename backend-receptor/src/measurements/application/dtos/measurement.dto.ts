import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { MeasurementType } from '../../domain/entities/measurement.entity';

export class CreateMeasurementDto {
  @IsString()
  @IsNotEmpty()
  externalId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(MeasurementType)
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

  @IsEnum(MeasurementType)
  @IsOptional()
  type?: MeasurementType;
}

import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  ValidateIf,
  Length,
} from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { AlertRuleMode } from '../../domain/entities/alert-rule.entity';

interface ValidationObject {
  mode: AlertRuleMode;
}

export class CreateAlertRuleDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @IsInt()
  measurementId!: number;

  @IsEnum(AlertRuleMode)
  mode!: AlertRuleMode;

  @ValidateIf((o: ValidationObject) => o.mode === AlertRuleMode.SETPOINT)
  @IsString()
  @IsNotEmpty()
  operator?: string;

  @ValidateIf((o: ValidationObject) => o.mode === AlertRuleMode.SETPOINT)
  @IsNumber()
  setpoint?: number;

  @ValidateIf((o: ValidationObject) => o.mode === AlertRuleMode.WINDOW)
  @IsNumber()
  minValue?: number;

  @ValidateIf((o: ValidationObject) => o.mode === AlertRuleMode.WINDOW)
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateAlertRuleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsInt()
  measurementId?: number;

  @IsOptional()
  @IsEnum(AlertRuleMode)
  mode?: AlertRuleMode;

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsNumber()
  setpoint?: number;

  @IsOptional()
  @IsNumber()
  minValue?: number;

  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

@Expose()
export class AlertRuleResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  measurementId!: number;

  @Expose()
  mode!: AlertRuleMode;

  @Expose()
  operator?: string;

  @Expose()
  setpoint?: number;

  @Expose()
  minValue?: number;

  @Expose()
  maxValue?: number;

  @Expose()
  isEnabled!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;

  @Expose()
  measurement?: {
    id: number;
    externalId: string;
    name: string;
    type: string;
  };
}

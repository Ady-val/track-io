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

  // Campos para modo setpoint
  @ValidateIf((o: ValidationObject) => o.mode === AlertRuleMode.SETPOINT)
  @IsString()
  @IsNotEmpty()
  operator?: string;

  @ValidateIf((o: ValidationObject) => o.mode === AlertRuleMode.SETPOINT)
  @IsNumber()
  setpoint?: number;

  // Campos para modo window
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

import {
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateAlertEscalationConfigDto {
  @IsInt()
  deviceId!: number;

  @IsInt()
  deviceSignalId!: number;

  @IsOptional()
  @IsString()
  @IsUrl()
  endpointUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  warningDelayMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  escalation1DelayMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  escalation2DelayMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  escalation3DelayMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

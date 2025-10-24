import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateAlertEscalationConfigDto {
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

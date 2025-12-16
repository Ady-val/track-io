import {
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaveEscalationMessageDto {
  @IsString()
  level!: string;

  @IsString()
  messageType!: string;

  @IsString()
  targetId!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  deviceColorId?: string;
}

export class SaveEscalationConfigDto {
  @IsInt()
  deviceId!: number;

  @IsInt()
  deviceSignalId!: number;

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveEscalationMessageDto)
  messages?: SaveEscalationMessageDto[];
}

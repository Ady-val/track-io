import {
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEscalationMessageDto {
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
  color?: string;
}

export class CreateEscalationConfigWithMessagesDto {
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEscalationMessageDto)
  messages?: CreateEscalationMessageDto[];
}

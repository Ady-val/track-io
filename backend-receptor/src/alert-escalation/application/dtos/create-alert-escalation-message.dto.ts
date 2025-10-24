import { IsInt, IsString, IsOptional, IsEnum } from 'class-validator';
import {
  AlertLevel,
  MessageType,
} from '../../domain/entities/alert-escalation-message.entity';

export class CreateAlertEscalationMessageDto {
  @IsInt()
  escalationConfigId!: number;

  @IsEnum(AlertLevel)
  level!: AlertLevel;

  @IsEnum(MessageType)
  messageType!: MessageType;

  @IsString()
  targetId!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  color?: string;
}

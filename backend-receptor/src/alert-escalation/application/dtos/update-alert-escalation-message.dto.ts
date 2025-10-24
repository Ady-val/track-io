import { IsString, IsOptional, IsEnum } from 'class-validator';
import { MessageType } from '../../domain/entities/alert-escalation-message.entity';

export class UpdateAlertEscalationMessageDto {
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

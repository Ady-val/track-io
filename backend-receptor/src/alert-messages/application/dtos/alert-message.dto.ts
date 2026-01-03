import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  Length,
  ValidateIf,
} from 'class-validator';
import { MessageType } from '../../domain/entities/alert-message.entity';

export class CreateAlertMessageDto {
  @IsEnum(MessageType)
  messageType!: MessageType;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  targetId!: string;

  @ValidateIf((o) => o.messageType !== MessageType.TORRETA)
  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  message!: string;

  @ValidateIf((o) => o.messageType === MessageType.TORRETA)
  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  color?: string;

  @IsInt()
  messageGroupId!: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  status?: string;
}

export class UpdateAlertMessageDto {
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  targetId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  message?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  color?: string;

  @IsOptional()
  @IsInt()
  messageGroupId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  status?: string;
}

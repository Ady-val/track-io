import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsOptional,
  Length,
  IsObject,
  IsArray,
  IsEmail,
} from 'class-validator';

interface TelegramMessageData {
  chatId: string;
  message: string;
}

interface TorretaMessageData {
  color: string;
  pattern: string;
}

interface EmailMessageData {
  to: string;
  subject: string;
  body: string;
}

interface ReceptorMessageData {
  deviceId: number;
  signal: string;
}

type MessageData =
  | EmailMessageData
  | ReceptorMessageData
  | TelegramMessageData
  | TorretaMessageData;

export class TelegramMessageDataDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  text!: string;
}

export class TorretaMessageDataDto {
  @IsInt()
  torretaId!: number;

  @IsInt()
  colorId!: number;
}

export class CorreoMessageDataDto {
  @IsArray()
  @IsEmail({}, { each: true })
  emails!: string[];

  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  message!: string;
}

export class ReceptorMessageDataDto {
  @IsInt()
  receptorId!: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  message!: string;
}

export class CreateAlertMessageDto {
  @IsEnum(['telegram', 'torreta', 'correo', 'receptor'])
  receptorType!: string;

  @IsObject()
  messageData!: MessageData;

  @IsInt()
  messageGroupId!: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  status?: string;
}

export class UpdateAlertMessageDto {
  @IsOptional()
  @IsEnum(['telegram', 'torreta', 'correo', 'receptor'])
  receptorType?: string;

  @IsOptional()
  @IsObject()
  messageData?: MessageData;

  @IsOptional()
  @IsInt()
  messageGroupId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  status?: string;
}

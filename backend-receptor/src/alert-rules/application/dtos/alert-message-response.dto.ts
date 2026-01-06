import { Expose } from 'class-transformer';

export class MessageGroupResponseDto {
  @Expose()
  id!: number;

  @Expose()
  nombre!: string;

  @Expose()
  color!: string;

  @Expose()
  descripcion!: string;
}

@Expose()
export class AlertMessageResponseDto {
  @Expose()
  id!: number;

  @Expose()
  messageType!: string;

  @Expose()
  targetId!: string;

  @Expose()
  message!: string;

  @Expose()
  color?: string;

  @Expose()
  messageGroupId!: number;

  @Expose()
  status!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  alertRuleId?: string;

  @Expose()
  messageGroup?: MessageGroupResponseDto;
}

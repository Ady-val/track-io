import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AlertRule } from '../../../alert-rules/domain/entities/alert-rule.entity';
import { MessageGroup } from '../../../message-groups/domain/entities/message-group.entity';

export enum ReceptorType {
  TELEGRAM = 'telegram',
  TORRETA = 'torreta',
  CORREO = 'correo',
  RECEPTOR = 'receptor',
}

export interface MessageData {
  telegram?: {
    title: string;
    text: string;
  };
  torreta?: {
    torretaId: number;
    colorId: number;
  };
  correo?: {
    emails: string[];
    subject: string;
    message: string;
  };
  receptor?: {
    receptorId: number;
    message: string;
  };
}

@Entity('alert_messages')
@Index(['alertRuleId'])
@Index(['messageGroupId'])
export class AlertMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'alert_rule_id', type: 'integer' })
  alertRuleId!: number;

  @Column({
    name: 'receptor_type',
    type: 'enum',
    enum: ReceptorType,
  })
  receptorType!: ReceptorType;

  @Column({ name: 'message_data', type: 'jsonb' })
  messageData!: MessageData;

  @Column({ name: 'message_group_id', type: 'integer' })
  messageGroupId!: number;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => AlertRule)
  @JoinColumn({ name: 'alert_rule_id' })
  alertRule?: AlertRule;

  @ManyToOne(() => MessageGroup, { eager: true })
  @JoinColumn({ name: 'message_group_id' })
  messageGroup?: MessageGroup;
}

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

export enum MessageType {
  TORRETA = 'torreta',
  RECEPTOR = 'receptor',
  EMAIL = 'email',
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
    name: 'message_type',
    type: 'enum',
    enum: MessageType,
  })
  messageType!: MessageType;

  @Column({ name: 'target_id', type: 'varchar', length: 255 })
  targetId!: string;

  @Column({ name: 'message', type: 'text' })
  message!: string;

  @Column({ name: 'color', type: 'varchar', length: 10, nullable: true })
  color?: string;

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

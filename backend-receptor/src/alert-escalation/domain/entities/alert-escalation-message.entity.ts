import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AlertEscalationConfig } from './alert-escalation-config.entity';

export enum AlertLevel {
  ALERT = 'alert',
  WARNING = 'warning',
  ESCALATION1 = 'escalation1',
  ESCALATION2 = 'escalation2',
  ESCALATION3 = 'escalation3',
  CLOSE = 'close',
}

export enum MessageType {
  TORRETA = 'torreta',
  RECEPTOR = 'receptor',
  EMAIL = 'email',
}

@Entity('alert_escalation_messages')
@Index(['escalationConfigId', 'level'])
export class AlertEscalationMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'escalation_config_id', type: 'integer' })
  escalationConfigId!: number;

  @Column({
    name: 'level',
    enum: AlertLevel,
  })
  level!: AlertLevel;

  @Column({
    name: 'message_type',
    enum: MessageType,
  })
  messageType!: MessageType;

  @Column({ name: 'target_id', type: 'varchar', length: 255 })
  targetId!: string;

  @Column({ name: 'message', type: 'text' })
  message!: string;

  @Column({ name: 'color', type: 'varchar', length: 10, nullable: true })
  color?: string;

  @CreateDateColumn({
    name: 'created_at',
    
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    
    nullable: true,
  })
  deletedAt?: Date;

  @ManyToOne(() => AlertEscalationConfig)
  @JoinColumn({ name: 'escalation_config_id' })
  escalationConfig?: AlertEscalationConfig;
}

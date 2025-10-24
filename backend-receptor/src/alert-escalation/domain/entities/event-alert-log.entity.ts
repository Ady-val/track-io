import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Event } from '../../../events/domain/entities/event.entity';
import { AlertLevel } from './alert-escalation-message.entity';

@Entity('event_alert_logs')
@Index(['eventId', 'level'])
@Index(['sentAt'])
export class EventAlertLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'event_id', type: 'integer' })
  eventId!: number;

  @Column({
    name: 'level',
    type: 'enum',
    enum: AlertLevel,
  })
  level!: AlertLevel;

  @Column({ name: 'sent_at', type: 'timestamp with time zone' })
  sentAt!: Date;

  @Column({ name: 'messages_sent', type: 'jsonb' })
  messagesSent!: any[]; // Array de mensajes enviados

  @Column({ name: 'success', type: 'boolean' })
  success!: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'endpoint_url', type: 'varchar', length: 500 })
  endpointUrl!: string;

  // Relations
  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event?: Event;
}

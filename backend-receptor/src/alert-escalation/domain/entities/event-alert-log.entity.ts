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
    enum: AlertLevel,
  })
  level!: AlertLevel;

  @Column({ name: 'sent_at' })
  sentAt!: Date;

  /** Stored as NVARCHAR(JSON) on SQL Server; use simple-json so the driver binds a string, not a raw array. */
  @Column({ name: 'messages_sent', type: 'simple-json' })
  messagesSent!: Array<{
    targetId: string;
    message: string;
    color?: string;
    messageType: string;
  }>;

  @Column({ name: 'success' })
  success!: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'endpoint_url', type: 'varchar', length: 500 })
  endpointUrl!: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event?: Event;
}

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
import { AreaDowntime } from './area-downtime.entity';
import { Event } from '../../../events/domain/entities/event.entity';

@Entity('area_downtime_events')
@Index(['areaDowntimeId', 'eventId'], { unique: true })
@Index(['areaDowntimeId'])
@Index(['eventId'])
export class AreaDowntimeEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'area_downtime_id', type: 'integer' })
  areaDowntimeId!: number;

  @Column({ name: 'event_id', type: 'integer' })
  eventId!: number;

  @Column({
    name: 'added_at',
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  addedAt!: Date;

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

  @ManyToOne(() => AreaDowntime, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'area_downtime_id' })
  areaDowntime?: AreaDowntime;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event?: Event;
}

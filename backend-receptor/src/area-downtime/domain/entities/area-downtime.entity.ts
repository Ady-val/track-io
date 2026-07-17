import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Area } from '../../../areas/domain/entities/area.entity';
import { AreaDowntimeEvent } from './area-downtime-event.entity';

@Entity('area_downtimes')
@Index(['areaId', 'isActive'])
@Index(['areaId', 'startAt'])
@Index(['startAt'])
export class AreaDowntime {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'area_id', type: 'integer' })
  areaId!: number;

  @Column({
    name: 'start_at',
    type: 'timestamp with time zone',
  })
  startAt!: Date;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: 'ends_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  endsAt?: Date;

  /** Crudo: ends_at − start_at (segundos). NULL mientras está activo. */
  @Column({ name: 'duration_seconds', type: 'integer', nullable: true })
  durationSeconds?: number;

  /** Descuento por paros programados aplicado al cerrar (segundos). */
  @Column({
    name: 'scheduled_downtime_discount_seconds',
    type: 'integer',
    nullable: true,
  })
  scheduledDowntimeDiscountSeconds?: number;

  /** duration_seconds − scheduled_downtime_discount_seconds. Nunca negativo. */
  @Column({
    name: 'effective_duration_seconds',
    type: 'integer',
    nullable: true,
  })
  effectiveDurationSeconds?: number;

  /** Traza congelada del descuento. */
  @Column({
    name: 'scheduled_downtime_snapshot',
    type: 'jsonb',
    nullable: true,
  })
  scheduledDowntimeSnapshot?: object | null;

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

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @OneToMany(
    () => AreaDowntimeEvent,
    areaDowntimeEvent => areaDowntimeEvent.areaDowntime
  )
  areaDowntimeEvents?: AreaDowntimeEvent[];
}

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
import { Measurement } from '../../../measurements/domain/entities/measurement.entity';

export enum AlertRuleMode {
  SETPOINT = 'setpoint',
  WINDOW = 'window',
}

@Entity('alert_rules')
@Index(['measurementId'])
@Index(['isEnabled'])
export class AlertRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'measurement_id', type: 'integer' })
  measurementId!: number;

  @Column({
    type: 'enum',
    enum: AlertRuleMode,
  })
  mode!: AlertRuleMode;

  @Column({ type: 'varchar', length: 10, nullable: true })
  operator?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  setpoint?: number;

  @Column({
    name: 'min_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  minValue?: number;

  @Column({
    name: 'max_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxValue?: number;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled!: boolean;

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

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt?: Date;

  // Relations
  @ManyToOne(() => Measurement, { eager: true })
  @JoinColumn({ name: 'measurement_id' })
  measurement?: Measurement;
}

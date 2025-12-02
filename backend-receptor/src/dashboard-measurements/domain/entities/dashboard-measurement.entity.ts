import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Measurement } from '../../../measurements/domain/entities/measurement.entity';
import { DashboardMeasurementGroup } from './dashboard-measurement-group.entity';

@Entity('dashboard_measurements')
export class DashboardMeasurement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'measurement_id' })
  measurementId!: number;

  @Column({ name: 'group_id', nullable: true })
  groupId?: number;

  @Column({ name: 'min_value', type: 'decimal', precision: 10, scale: 2 })
  minValue!: number;

  @Column({ name: 'max_value', type: 'decimal', precision: 10, scale: 2 })
  maxValue!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Measurement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'measurement_id' })
  measurement!: Measurement;

  @ManyToOne(
    () => DashboardMeasurementGroup,
    group => group.dashboardMeasurements,
    { onDelete: 'SET NULL' }
  )
  @JoinColumn({ name: 'group_id' })
  group?: DashboardMeasurementGroup;
}

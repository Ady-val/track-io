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

@Entity('dashboard_measurements')
export class DashboardMeasurement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'measurement_id' })
  measurementId!: number;

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

  // Relations
  @ManyToOne(() => Measurement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'measurement_id' })
  measurement!: Measurement;
}

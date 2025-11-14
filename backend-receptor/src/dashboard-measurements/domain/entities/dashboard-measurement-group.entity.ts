import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { DashboardMeasurement } from './dashboard-measurement.entity';

@Entity('dashboard_measurement_groups')
export class DashboardMeasurementGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToMany(
    () => DashboardMeasurement,
    (dashboardMeasurement) => dashboardMeasurement.group
  )
  dashboardMeasurements!: DashboardMeasurement[];
}


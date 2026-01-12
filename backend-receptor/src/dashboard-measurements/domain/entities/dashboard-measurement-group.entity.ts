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

  @Column({ name: 'chart_time_range', type: 'int', nullable: true })
  chartTimeRange?: number;

  @Column({
    name: 'chart_min_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  chartMinValue?: number;

  @Column({
    name: 'chart_max_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  chartMaxValue?: number;

  @Column({
    name: 'chart_measurement_ids',
    type: 'nvarchar', length: 'max',
    nullable: true,
  })
  chartMeasurementIds?: number[];

  @OneToMany(
    () => DashboardMeasurement,
    dashboardMeasurement => dashboardMeasurement.group,
    { cascade: true }
  )
  dashboardMeasurements!: DashboardMeasurement[];
}

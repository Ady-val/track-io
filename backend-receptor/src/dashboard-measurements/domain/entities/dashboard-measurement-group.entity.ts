import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ValueTransformer,
} from 'typeorm';
import { DashboardMeasurement } from './dashboard-measurement.entity';

const chartMeasurementIdsTransformer: ValueTransformer = {
  to(value?: number[] | null): string | null {
    if (!value || value.length === 0) {
      return null;
    }

    return JSON.stringify(value);
  },
  from(value?: string | number[] | null): number[] | null {
    if (!value) {
      return null;
    }

    if (Array.isArray(value)) {
      return value.map(Number).filter(Number.isFinite);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map(Number).filter(Number.isFinite);
        }
      } catch {
        // fall through to comma-separated parsing
      }

      return trimmed
        .split(',')
        .map(item => Number(item.trim()))
        .filter(Number.isFinite);
    }

    return null;
  },
};

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
    transformer: chartMeasurementIdsTransformer,
  })
  chartMeasurementIds?: number[];

  @OneToMany(
    () => DashboardMeasurement,
    dashboardMeasurement => dashboardMeasurement.group,
    { cascade: true }
  )
  dashboardMeasurements!: DashboardMeasurement[];
}

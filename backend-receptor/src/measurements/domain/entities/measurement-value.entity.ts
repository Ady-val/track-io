import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Measurement } from './measurement.entity';

@Entity('measurement_values')
@Index(['measurementId'])
@Index(['createdAt'])
export class MeasurementValue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'measurement_id', type: 'int' })
  measurementId!: number;

  @ManyToOne(() => Measurement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'measurement_id' })
  measurement?: Measurement;

  @Column({ type: 'varchar', length: 255 })
  value!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt!: Date;
}

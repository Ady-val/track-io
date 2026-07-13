import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum MeasurementType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  DEW_POINT = 'dew_point',
  PPM = 'ppm',
  PRESSURE = 'pressure',
  LEVEL = 'level',
  FLOW = 'flow',
  VIBRATION = 'vibration',
  STATUS = 'status',
}

@Entity('measurements')
// Note: Unique index on externalId is handled by migration as a partial index
// (only for non-deleted records) to allow soft-deleted measurements to be recreated
export class Measurement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'external_id', type: 'varchar', length: 255 })
  externalId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: MeasurementType,
  })
  type!: MeasurementType;

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
}

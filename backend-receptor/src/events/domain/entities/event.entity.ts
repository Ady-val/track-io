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
import { Area } from '../../../areas/domain/entities/area.entity';
import { Department } from '../../../departments/domain/entities/department.entity';
import { Device } from '../../../devices/domain/entities/device.entity';
import { DeviceSignal } from '../../../device-signals/domain/entities/device-signal.entity';

export enum EventStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  CLOSED = 'closed',
}

@Entity('events')
@Index(['areaId', 'departmentId'])
@Index(['deviceId', 'deviceSignalId'])
@Index(['status'])
@Index(['createdAt'])
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'area_id', type: 'integer' })
  areaId!: number;

  @Column({ name: 'area_name', type: 'varchar', length: 255 })
  areaName!: string;

  @Column({ name: 'department_id', type: 'integer' })
  departmentId!: number;

  @Column({ name: 'department_name', type: 'varchar', length: 255 })
  departmentName!: string;

  @Column({ name: 'device_id', type: 'integer' })
  deviceId!: number;

  @Column({ name: 'device_name', type: 'varchar', length: 255 })
  deviceName!: string;

  @Column({ name: 'device_signal_id', type: 'integer' })
  deviceSignalId!: number;

  @Column({ name: 'device_signal_name', type: 'varchar', length: 255 })
  deviceSignalName!: string;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.OPEN,
  })
  status!: EventStatus;

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

  @Column({
    name: 'in_progress_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  inProgressAt?: Date;

  @Column({
    name: 'closed_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  closedAt?: Date;

  @Column({
    name: 'duration_seconds',
    type: 'integer',
    nullable: true,
  })
  durationSeconds?: number;

  // Relations
  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'device_id' })
  device?: Device;

  @ManyToOne(() => DeviceSignal)
  @JoinColumn({ name: 'device_signal_id' })
  deviceSignal?: DeviceSignal;
}




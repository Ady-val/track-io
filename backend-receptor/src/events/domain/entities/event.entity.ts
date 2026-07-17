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

  /**
   * Descuento por paros programados aplicado al cerrar (segundos).
   * NULL mientras el evento está abierto; 0 si no hubo traslape.
   * Ver documentation/PLAN_MIGRACION_IOTRACK.md §1.3.2.
   */
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

  /**
   * Parte del descuento por paros programados que cayó dentro del tramo de
   * ATENCIÓN (`created_at` → `in_progress_at`). NULL mientras el evento está
   * abierto (o si `in_progress_at` era null al cerrar). Ver BUILD_SPEC_FASE2 §4.1.
   * El descuento del tramo de solución se deriva:
   *   resolutionDiscount = scheduled_downtime_discount_seconds − response_discount_seconds.
   */
  @Column({
    name: 'response_discount_seconds',
    type: 'integer',
    nullable: true,
  })
  responseDiscountSeconds?: number;

  @Column({ name: 'virtual_device', type: 'boolean', default: false })
  virtualDevice!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

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

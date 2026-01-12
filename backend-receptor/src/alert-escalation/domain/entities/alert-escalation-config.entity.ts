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
import { Device } from '../../../devices/domain/entities/device.entity';
import { DeviceSignal } from '../../../device-signals/domain/entities/device-signal.entity';

@Entity('alert_escalation_configs')
@Index(['deviceId', 'deviceSignalId'])
export class AlertEscalationConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'device_id', type: 'integer' })
  deviceId!: number;

  @Column({ name: 'device_signal_id', type: 'integer' })
  deviceSignalId!: number;

  @Column({
    name: 'endpoint_url',
    type: 'varchar',
    length: 500,
    default: 'http://host.docker.internal:1880/events',
  })
  endpointUrl!: string;

  @Column({ name: 'warning_delay_minutes', type: 'integer', default: 20 })
  warningDelayMinutes!: number;

  @Column({ name: 'escalation1_delay_minutes', type: 'integer', default: 40 })
  escalation1DelayMinutes!: number;

  @Column({ name: 'escalation2_delay_minutes', type: 'integer', default: 60 })
  escalation2DelayMinutes!: number;

  @Column({ name: 'escalation3_delay_minutes', type: 'integer', default: 80 })
  escalation3DelayMinutes!: number;

  @Column({ name: 'is_active',  default: true })
  isActive!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    
    nullable: true,
  })
  deletedAt?: Date;

  @ManyToOne(() => Device, { eager: true })
  @JoinColumn({ name: 'device_id' })
  device?: Device;

  @ManyToOne(() => DeviceSignal, { eager: true })
  @JoinColumn({ name: 'device_signal_id' })
  deviceSignal?: DeviceSignal;
}

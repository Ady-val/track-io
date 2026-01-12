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
import { Department } from '../../../departments/domain/entities/department.entity';

@Entity('device_signals')
@Index(['deviceId'])
@Index(['departmentId'])
@Index(['externalValueId'])
export class DeviceSignal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'device_id', type: 'integer' })
  deviceId!: number;

  @Column({ name: 'department_id', type: 'integer' })
  departmentId!: number;

  @Column({ name: 'external_value_id', type: 'varchar', length: 255 })
  externalValueId!: string;

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
    
  })
  deletedAt?: Date;

  @ManyToOne(() => Device, { eager: true })
  @JoinColumn({ name: 'device_id' })
  device?: Device;

  @ManyToOne(() => Department, { eager: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;
}

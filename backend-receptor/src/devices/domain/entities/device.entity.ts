import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Area } from '../../../areas/domain/entities/area.entity';
import { DeviceSignal } from '../../../device-signals/domain/entities/device-signal.entity';

@Entity('devices')
@Index(['externalId'])
export class Device {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'area_id', type: 'integer' })
  areaId!: number;

  @Column({ name: 'external_id', type: 'varchar', length: 255, unique: true })
  externalId!: string;

  @Column({ name: 'is_virtual_device',  default: false })
  isVirtualDevice!: boolean;

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

  @ManyToOne(() => Area, { eager: true })
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @OneToMany(() => DeviceSignal, deviceSignal => deviceSignal.device)
  deviceSignals?: DeviceSignal[];
}

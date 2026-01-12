import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Area } from '../../../areas/domain/entities/area.entity';
import { AreaDowntimeEvent } from './area-downtime-event.entity';

@Entity('area_downtimes')
@Index(['areaId', 'isActive'])
@Index(['areaId', 'startAt'])
@Index(['startAt'])
export class AreaDowntime {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'area_id', type: 'integer' })
  areaId!: number;

  @Column({
    name: 'start_at',
    
  })
  startAt!: Date;

  @Column({
    name: 'is_active',
    
    default: true,
  })
  isActive!: boolean;

  @Column({
    name: 'ends_at',
    
    nullable: true,
  })
  endsAt?: Date;

  @CreateDateColumn({
    name: 'created_at',
    
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    
  })
  updatedAt!: Date;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area?: Area;

  @OneToMany(
    () => AreaDowntimeEvent,
    areaDowntimeEvent => areaDowntimeEvent.areaDowntime
  )
  areaDowntimeEvents?: AreaDowntimeEvent[];
}

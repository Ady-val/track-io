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
import { Area } from '../../../areas/domain/entities/area.entity';

/**
 * Paro programado: ventana horaria recurrente (por día de la semana) durante la
 * cual un área se considera detenida "a propósito" (comida, cambio de turno,
 * capacitación, fuera de horario laboral, etc.) y por lo tanto ese tiempo debe
 * descontarse de los cálculos de tiempo de paro real.
 *
 * daysOfWeek usa la misma convención que Date.getDay() de JS: 0 = domingo … 6 = sábado.
 */
@Entity('scheduled_downtimes')
@Index(['areaId'])
@Index(['areaId', 'isActive'])
export class ScheduledDowntime {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'area_id', type: 'integer' })
  areaId!: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'days_of_week', type: 'jsonb' })
  daysOfWeek!: number[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

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
  })
  deletedAt?: Date;

  @ManyToOne(() => Area, { eager: true })
  @JoinColumn({ name: 'area_id' })
  area?: Area;
}

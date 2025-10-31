import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('torretas')
export class Torreta {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({
    name: 'external_id',
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
  })
  externalId?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  // Banner config
  @Column({ name: 'type', type: 'varchar', length: 20, default: 'STANDARD' })
  type!: 'STANDARD' | 'BANNER';

  @Column({ name: 'mode', type: 'varchar', length: 20, nullable: true })
  mode?: 'AREA' | 'DEPARTMENT';

  @Column({ name: 'start_register', type: 'integer', nullable: true })
  startRegister?: number;

  @Column({ name: 'register_count', type: 'integer', nullable: true })
  registerCount?: number;

  @Column({ name: 'area_id', type: 'integer', nullable: true })
  areaId?: number;

  @Column({ name: 'department_id', type: 'integer', nullable: true })
  departmentId?: number;

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

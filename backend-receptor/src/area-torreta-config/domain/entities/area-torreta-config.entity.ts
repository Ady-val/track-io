import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum TorretaConfigurationType {
  AREA = 'area',
  DEPARTMENT = 'department',
}

@Entity('area_torreta_configs')
@Index(['areaId', 'torretaExternalId'])
export class AreaTorretaConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'area_id', type: 'integer' })
  areaId!: number;

  @Column({ name: 'torreta_external_id', type: 'varchar', length: 255 })
  torretaExternalId!: string;

  @Column({
    name: 'configuration_type',
    type: 'enum',
    enum: TorretaConfigurationType,
    default: TorretaConfigurationType.AREA,
  })
  configurationType!: TorretaConfigurationType;

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
    nullable: true,
  })
  deletedAt?: Date;
}

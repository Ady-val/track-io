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
    enum: TorretaConfigurationType,
    default: TorretaConfigurationType.AREA,
  })
  configurationType!: TorretaConfigurationType;

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
}

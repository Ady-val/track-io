import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('raw_measurements')
@Index(['externalId'])
@Index(['createdAt'])
export class RawMeasurement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'external_id', type: 'varchar', length: 255 })
  externalId!: string;

  @Column({ type: 'varchar', length: 255 })
  value!: string;

  @Column({ name: 'virtual_device',  default: false })
  virtualDevice!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn({
    name: 'created_at',
    
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    
  })
  updatedAt!: Date;
}

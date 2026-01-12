import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('receptors')
@Index(['externalId'], { unique: true })
export class Receptor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'external_id', type: 'varchar', length: 255, unique: true })
  externalId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

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

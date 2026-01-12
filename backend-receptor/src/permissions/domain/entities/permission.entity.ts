import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
@Index(['module', 'action'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  module!: string;

  @Column({ type: 'varchar', length: 50 })
  action!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({
    name: 'created_at',
    
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    
  })
  updatedAt!: Date;

  @ManyToMany(() => Role, role => role.permissions)
  roles?: Role[];
}

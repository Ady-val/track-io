import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Session } from '../../../auth/domain/entities/session.entity';

@Entity('users')
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ name: 'created_by', type: 'varchar', length: 255, nullable: true })
  createdBy?: string | null;

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

  @OneToMany(() => Session, session => session.user)
  sessions?: Session[];
}

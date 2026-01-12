import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Session } from '../../../auth/domain/entities/session.entity';
import { Role } from '../../../permissions/domain/entities/role.entity';
import { UserRole } from '../../../permissions/domain/entities/user-role.entity';

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

  @OneToMany(() => Session, session => session.user)
  sessions?: Session[];

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles?: Role[];

  @OneToMany(() => UserRole, userRole => userRole.user)
  userRoles?: UserRole[];
}

import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../../users/domain/entities/user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Index(['userId'])
@Index(['roleId'])
export class UserRole {
  @PrimaryColumn({ name: 'user_id', type: 'integer' })
  userId!: number;

  @PrimaryColumn({ name: 'role_id', type: 'integer' })
  roleId!: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt!: Date;

  @ManyToOne(() => User, user => user.userRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role?: Role;
}

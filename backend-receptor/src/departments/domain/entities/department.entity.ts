import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'html_color', type: 'varchar', length: 7, nullable: true })
  htmlColor?: string;

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
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('torreta_colors')
@Index(['name'], { unique: true })
export class TorretaColor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ name: 'html_color', type: 'varchar', length: 7 })
  htmlColor!: string;

  @Column({ name: 'device_color_id', type: 'varchar', length: 10 })
  deviceColorId!: string;

  @Column({ type: 'integer', default: 0 })
  order!: number;

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
}

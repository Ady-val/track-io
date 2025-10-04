import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('raw_signals')
@Index(['externalId'])
@Index(['createdAt'])
export class RawSignal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'external_id', type: 'varchar', length: 255 })
  externalId!: string;

  @Column({ type: 'varchar', length: 255 })
  value!: string;

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

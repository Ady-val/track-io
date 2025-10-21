import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('processed_signals')
@Index(['deviceId'])
@Index(['deviceSignalId'])
@Index(['createdAt'])
export class ProcessedSignal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'device_id', type: 'integer', nullable: true })
  deviceId?: number;

  @Column({ name: 'device_name', type: 'varchar', length: 255, nullable: true })
  deviceName?: string;

  @Column({ name: 'device_signal_id', type: 'integer', nullable: true })
  deviceSignalId?: number;

  @Column({
    name: 'device_signal_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  deviceSignalName?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt!: Date;
}

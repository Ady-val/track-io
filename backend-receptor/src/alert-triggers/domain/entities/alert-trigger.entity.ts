import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AlertRule } from '../../../alert-rules/domain/entities/alert-rule.entity';
import { RawMeasurement } from '../../../raw-measurements/domain/entities/raw-measurement.entity';

@Entity('alert_triggers')
@Index(['alertRuleId'])
@Index(['rawMeasurementId'])
@Index(['triggeredAt'])
export class AlertTrigger {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'alert_rule_id', type: 'integer' })
  alertRuleId!: number;

  @Column({ name: 'raw_measurement_id', type: 'integer' })
  rawMeasurementId!: number;

  @Column({
    name: 'measurement_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  measurementValue!: number;

  @Column({ name: 'condition_result', type: 'varchar', length: 500 })
  conditionResult!: string;

  @Column({ name: 'messages_triggered', type: 'nvarchar', length: 'max' })
  messagesTriggered!: number[];

  @CreateDateColumn({
    name: 'triggered_at',
    
  })
  triggeredAt!: Date;

  @ManyToOne(() => AlertRule, { eager: true })
  @JoinColumn({ name: 'alert_rule_id' })
  alertRule?: AlertRule;

  @ManyToOne(() => RawMeasurement)
  @JoinColumn({ name: 'raw_measurement_id' })
  rawMeasurement?: RawMeasurement;
}

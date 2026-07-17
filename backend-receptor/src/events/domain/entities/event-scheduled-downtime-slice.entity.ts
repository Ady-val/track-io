import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/** Tramo del ciclo del evento al que se atribuye la rebanada. */
export enum SliceSegment {
  RESPONSE = 'response',
  RESOLUTION = 'resolution',
}

/**
 * Registro de transparencia de la Fase 2: una rebanada disjunta de paro
 * programado que influyó en un evento, con su ocurrencia real (de qué hora a
 * qué hora) y sus valores CONGELADOS al cerrar.
 *
 * Sin FK DDL al catálogo (`scheduled_downtime_id` es informativo): la fila del
 * catálogo puede borrarse y el histórico no debe romperse ni cambiar. `name` y
 * `configured*` se copian al escribir; si renombran "Comida" → "Lunch", el
 * histórico sigue diciendo "Comida". Ver BUILD_SPEC_FASE2 §4.2.
 */
@Entity('event_scheduled_downtime_slices')
@Index(['eventId'])
@Index(['occurredFrom'])
@Index(['scheduledDowntimeId'])
export class EventScheduledDowntimeSlice {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'event_id', type: 'integer' })
  eventId!: number;

  /** Informativo. Sin constraint FK: el catálogo puede borrarse. */
  @Column({ name: 'scheduled_downtime_id', type: 'integer' })
  scheduledDowntimeId!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'configured_start_time', type: 'time' })
  configuredStartTime!: string;

  @Column({ name: 'configured_end_time', type: 'time' })
  configuredEndTime!: string;

  @Column({ name: 'occurred_from', type: 'timestamp with time zone' })
  occurredFrom!: Date;

  @Column({ name: 'occurred_to', type: 'timestamp with time zone' })
  occurredTo!: Date;

  @Column({ type: 'integer' })
  seconds!: number;

  @Column({ type: 'varchar', length: 20 })
  segment!: SliceSegment;

  @Column({ type: 'varchar', length: 64 })
  timezone!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt!: Date;
}

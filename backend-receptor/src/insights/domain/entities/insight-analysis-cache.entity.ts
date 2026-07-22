import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Caché de resultados del análisis de patrones con IA. `cacheKey` identifica
 * de forma determinista un rango + área + idioma + modelo (ver
 * InsightsService.buildCacheKey). Evita pagar una llamada al modelo de nuevo
 * dentro del TTL configurado (INSIGHTS_CACHE_TTL_MINUTES).
 */
@Entity('insight_analysis_cache')
@Index(['expiresAt'])
export class InsightAnalysisCache {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'cache_key', type: 'varchar', length: 64, unique: true })
  cacheKey!: string;

  @Column({ name: 'start_date', type: 'timestamp with time zone' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone' })
  endDate!: Date;

  @Column({ name: 'area_id', type: 'integer', nullable: true })
  areaId?: number;

  @Column({ name: 'findings_json', type: 'jsonb' })
  findingsJson!: unknown;

  @Column({ name: 'total_events_analyzed', type: 'integer' })
  totalEventsAnalyzed!: number;

  @Column({ type: 'varchar', length: 255 })
  model!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp with time zone' })
  expiresAt!: Date;
}

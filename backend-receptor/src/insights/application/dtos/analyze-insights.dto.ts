import {
  IsOptional,
  IsInt,
  IsPositive,
  IsISO8601,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { GroupBy } from '../../../reports/application/services/plant-time.util';

export type InsightLanguage = 'en' | 'es';

/** Query de POST /insights/analyze. */
export class AnalyzeInsightsDto {
  @IsISO8601(
    { strict: false },
    { message: 'startDate debe ser ISO 8601 con offset explícito' }
  )
  startDate!: string;

  @IsISO8601(
    { strict: false },
    { message: 'endDate debe ser ISO 8601 con offset explícito' }
  )
  endDate!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'areaId must be an integer' })
  @IsPositive({ message: 'areaId must be a positive integer' })
  areaId?: number;

  @IsOptional()
  @IsIn(['es', 'en'], { message: 'language debe ser es o en' })
  language?: InsightLanguage;

  /**
   * Si no viene, InsightsService la deriva del tamaño del rango (§Tarea 3):
   * ≤14 días → day, ≤60 días → week, más → month.
   */
  @IsOptional()
  @IsIn(['day', 'week', 'month'], {
    message: 'groupBy debe ser day, week o month',
  })
  groupBy?: GroupBy;
}

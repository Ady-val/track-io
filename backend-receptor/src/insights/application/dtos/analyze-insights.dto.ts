import {
  IsOptional,
  IsInt,
  IsPositive,
  IsISO8601,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

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
}

import {
  IsOptional,
  IsInt,
  IsPositive,
  IsISO8601,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export type GroupBy = 'day' | 'month' | 'week';

/** Query de GET /reports/downtime y /reports/downtime/export. */
export class DowntimeReportQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'areaId must be an integer' })
  @IsPositive({ message: 'areaId must be a positive integer' })
  areaId?: number;

  @IsISO8601(
    { strict: false },
    { message: 'from debe ser ISO 8601 con offset explícito' }
  )
  from!: string;

  @IsISO8601(
    { strict: false },
    { message: 'to debe ser ISO 8601 con offset explícito' }
  )
  to!: string;

  @IsOptional()
  @IsIn(['day', 'week', 'month'], {
    message: 'groupBy debe ser day, week o month',
  })
  groupBy?: GroupBy;
}

/** Query de GET /reports/events. */
export class EventReportQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  areaId?: number;

  @IsISO8601({ strict: false })
  from!: string;

  @IsISO8601({ strict: false })
  to!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  departmentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  offset?: number;
}

// ---------------------------------------------------------------------------
// Tipos de respuesta (§5.2, §5.6). Todos los tiempos en SEGUNDOS ENTEROS.
// ---------------------------------------------------------------------------

export interface DowntimeReportSummary {
  calendarSeconds: number;
  scheduledDowntimeSeconds: number;
  plannedProductionSeconds: number;
  unplannedDowntimeSeconds: number;
  runSeconds: number;
  availability: number | null;
  eventCount: number;
  avgResponseSeconds: number | null;
  avgResolutionSeconds: number | null;
  hasScheduledDowntimeConfigured: boolean;
}

export interface DowntimeReportDepartmentRow {
  departmentId: number;
  departmentName: string;
  unplannedDowntimeSeconds: number;
  eventCount: number;
  avgResponseSeconds: number | null;
  avgResolutionSeconds: number | null;
  cumulativePercent: number;
}

export interface DowntimeReportTrendRow {
  bucket: string;
  scheduledDowntimeSeconds: number;
  unplannedDowntimeSeconds: number;
  plannedProductionSeconds: number;
  runSeconds: number;
  availability: number | null;
}

export interface DowntimeReport {
  range: { from: string; to: string; timezone: string; groupBy: GroupBy };
  scope: { areaId: number | null; areaName: string | null };
  summary: DowntimeReportSummary;
  byDepartment: DowntimeReportDepartmentRow[];
  trend: DowntimeReportTrendRow[];
}

export interface EventReportSlice {
  name: string;
  configuredStartTime: string;
  configuredEndTime: string;
  occurredFrom: string;
  occurredTo: string;
  seconds: number;
  segment: 'resolution' | 'response';
}

export interface EventReportRow {
  id: number;
  areaName: string;
  departmentName: string;
  createdAt: string;
  inProgressAt: string | null;
  closedAt: string | null;
  durationSeconds: number | null;
  scheduledDowntimeDiscountSeconds: number | null;
  effectiveDurationSeconds: number | null;
  responseSeconds: number | null;
  effectiveResponseSeconds: number | null;
  resolutionSeconds: number | null;
  effectiveResolutionSeconds: number | null;
  virtualDevice: boolean;
  reason: string | null;
  comment: string | null;
  scheduledDowntimeSlices: EventReportSlice[];
}

export interface EventReportResult {
  data: EventReportRow[];
  total: number;
  pagination: { limit: number; offset: number; total: number };
}

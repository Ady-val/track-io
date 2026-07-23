import type {
  InsightCategory,
  InsightSeverity,
} from '../../domain/types/insight-finding.type';
import type { GroupBy } from '../../../reports/application/services/plant-time.util';

export interface InsightSupportingMetric {
  label: string;
  value: string;
  comparison?: string;
}

/**
 * Hallazgo final devuelto al frontend. `supportingMetric` SIEMPRE se calculó
 * en el backend contra el payload agregado real — nunca es lo que dijo el
 * modelo. Ver InsightsService.resolveAndValidate().
 */
export interface InsightFindingDto {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  supportingMetric: InsightSupportingMetric;
  relatedAreaId?: number;
  relatedDepartmentId?: number;
  relatedSignalId?: number;
}

export type InsightNoticeCode = 'DEGENERATE_GROUPING' | 'SMALL_SAMPLE';

/** Aviso estructurado sobre limitaciones del análisis (§Tareas 3 y 4). */
export interface InsightNotice {
  code: InsightNoticeCode;
  message: string;
}

export interface InsightTopMetric {
  name: string;
  minutes: number;
}

/**
 * Resumen del periodo que SIEMPRE cambia con fechas/área, aunque los
 * hallazgos del modelo se parezcan entre sí (§Tarea 5 — "hacer visible lo
 * que sí se mueve").
 */
export interface InsightPeriodSummary {
  totalEventsAnalyzed: number;
  totalDowntimeMinutes: number;
  topDepartment: InsightTopMetric | null;
  topSignal: InsightTopMetric | null;
}

export interface InsightAnalysisMeta {
  startDate: string;
  endDate: string;
  totalEventsAnalyzed: number;
  generatedAt: string;
  model: string;
  cached: boolean;
  groupBy: GroupBy;
  notices?: InsightNotice[];
  summary: InsightPeriodSummary;
}

export interface InsightAnalysisResponseDto {
  findings: InsightFindingDto[];
  meta: InsightAnalysisMeta;
}

export interface InsightsHealthDto {
  enabled: boolean;
  modelConfigured: boolean;
}

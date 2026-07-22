import type {
  InsightCategory,
  InsightSeverity,
} from '../../domain/types/insight-finding.type';

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

export interface InsightAnalysisMeta {
  startDate: string;
  endDate: string;
  totalEventsAnalyzed: number;
  generatedAt: string;
  model: string;
  cached: boolean;
}

export interface InsightAnalysisResponseDto {
  findings: InsightFindingDto[];
  meta: InsightAnalysisMeta;
}

export interface InsightsHealthDto {
  enabled: boolean;
  modelConfigured: boolean;
}

// Espejo de los contratos de backend (backend-receptor/src/insights).

import type { GroupBy } from "@/types/report";

export type InsightSeverity = "info" | "warning" | "critical";

export type InsightCategory =
  | "departamento"
  | "area"
  | "señal"
  | "motivo"
  | "horario"
  | "escalamiento";

export interface InsightSupportingMetric {
  label: string;
  value: string;
  comparison?: string;
}

export interface InsightFinding {
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

export type InsightNoticeCode = "DEGENERATE_GROUPING" | "SMALL_SAMPLE";

export interface InsightNotice {
  code: InsightNoticeCode;
  message: string;
}

export interface InsightTopMetric {
  name: string;
  minutes: number;
}

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

export interface InsightAnalysisResult {
  findings: InsightFinding[];
  meta: InsightAnalysisMeta;
}

export interface InsightAnalysisResponse {
  message: string;
  data: InsightAnalysisResult;
}

export interface InsightsHealth {
  enabled: boolean;
  modelConfigured: boolean;
}

export interface AnalyzeInsightsParams {
  startDate: string;
  endDate: string;
  areaId?: number;
  language?: "es" | "en";
  groupBy?: GroupBy;
}

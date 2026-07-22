// Espejo de los contratos de backend (backend-receptor/src/insights).

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

export interface InsightAnalysisMeta {
  startDate: string;
  endDate: string;
  totalEventsAnalyzed: number;
  generatedAt: string;
  model: string;
  cached: boolean;
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
}

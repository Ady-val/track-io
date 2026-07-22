export type InsightSeverity = 'critical' | 'info' | 'warning';

export type InsightCategory =
  | 'area'
  | 'departamento'
  | 'escalamiento'
  | 'horario'
  | 'motivo'
  | 'señal';

/**
 * Hallazgo tal como lo devuelve el modelo, ANTES de resolver la métrica de
 * soporte contra el payload real. `supportMetricValue`/`supportComparison`
 * llegan del modelo pero NUNCA se usan directamente en la respuesta final:
 * InsightsService.resolveAndValidate() los descarta y recalcula
 * `supportingMetric` a partir del payload agregado (ver §4.7 del spec).
 */
export interface RawFinding {
  title: string;
  description: string;
  severity: InsightSeverity;
  category: InsightCategory;
  supportMetricLabel: string;
  supportMetricValue: string;
  supportComparison?: string;
  relatedAreaId?: number;
  relatedDepartmentId?: number;
  relatedSignalId?: number;
}

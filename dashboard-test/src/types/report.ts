// Espejo de los contratos de backend §5.2 y §5.6. Tiempos en SEGUNDOS enteros.

export type GroupBy = "day" | "week" | "month";

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

export interface DowntimeReportResponse {
  message: string;
  data: DowntimeReport;
}

export interface EventReportSlice {
  name: string;
  configuredStartTime: string;
  configuredEndTime: string;
  occurredFrom: string;
  occurredTo: string;
  seconds: number;
  segment: "response" | "resolution";
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

export interface EventReportResponse {
  message: string;
  data: EventReportRow[];
  total: number;
  pagination: { limit: number; offset: number; total: number };
}

export interface DowntimeReportParams {
  areaId?: number;
  from: string;
  to: string;
  groupBy?: GroupBy;
}

export interface EventReportParams {
  areaId?: number;
  from: string;
  to: string;
  departmentId?: number;
  limit?: number;
  offset?: number;
}

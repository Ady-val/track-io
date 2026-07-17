import { formatAvailability, formatDuration } from "@/lib/formatDuration";
import type { DowntimeReportSummary } from "@/types/report";

import { REPORT_COLORS } from "./reportColors";

/** Las 5 tarjetas KPI de la cabecera (§8.4.2). */
export function ReportKpiCards({
  summary,
}: {
  summary: DowntimeReportSummary;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <KpiCard
        color={summary.availability == null ? "#94a3b8" : REPORT_COLORS.run}
        label="Disponibilidad"
        title={
          summary.availability == null
            ? "La línea no tenía tiempo productivo planeado en este rango"
            : undefined
        }
        value={formatAvailability(summary.availability)}
      />
      <KpiCard
        color={REPORT_COLORS.unplanned}
        label="Paro no programado"
        value={formatDuration(summary.unplannedDowntimeSeconds)}
      />
      <KpiCard
        color={REPORT_COLORS.scheduled}
        label="Paro programado"
        value={formatDuration(summary.scheduledDowntimeSeconds)}
      />
      <KpiCard label="Nº de paros" value={String(summary.eventCount)} />
      <KpiCard
        label="Atención / Solución prom."
        value={`${formatDuration(summary.avgResponseSeconds)} / ${formatDuration(
          summary.avgResolutionSeconds
        )}`}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
  title,
}: {
  label: string;
  value: string;
  color?: string;
  title?: string;
}) {
  return (
    <div
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
      title={title}
    >
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color ?? "#f1f5f9" }}>
        {value}
      </p>
    </div>
  );
}

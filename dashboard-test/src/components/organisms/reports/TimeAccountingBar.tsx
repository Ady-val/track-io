import { formatDuration } from "@/lib/formatDuration";
import type { DowntimeReportSummary } from "@/types/report";

import { REPORT_COLORS } from "./reportColors";

/**
 * Bloque héroe (§8.4.3): la contabilidad del tiempo como barra segmentada
 * (programado / no programado / corriendo) CON la resta escrita debajo, para
 * que el requisito del negocio —ver la resta— se cumpla sin Chart.js.
 *
 * calendar = programado + no programado + corriendo, así que los tres segmentos
 * suman el 100 %.
 */
export function TimeAccountingBar({
  summary,
  showScheduled = true,
}: {
  summary: DowntimeReportSummary;
  showScheduled?: boolean;
}) {
  const {
    calendarSeconds,
    scheduledDowntimeSeconds,
    unplannedDowntimeSeconds,
    plannedProductionSeconds,
    runSeconds,
  } = summary;

  const pct = (s: number) =>
    calendarSeconds > 0 ? (s / calendarSeconds) * 100 : 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Contabilidad del tiempo
      </h3>

      <div className="flex w-full h-10 rounded overflow-hidden mb-4">
        {showScheduled && (
          <Segment
            color={REPORT_COLORS.scheduled}
            label="Programado"
            widthPercent={pct(scheduledDowntimeSeconds)}
          />
        )}
        <Segment
          color={REPORT_COLORS.unplanned}
          label="No programado"
          widthPercent={pct(unplannedDowntimeSeconds)}
        />
        <Segment
          color={REPORT_COLORS.run}
          label="Corriendo"
          widthPercent={pct(runSeconds)}
        />
      </div>

      <div className="text-sm text-slate-300 space-y-1 font-mono">
        <p>
          Tiempo calendario{" "}
          <strong className="text-white">
            {formatDuration(calendarSeconds)}
          </strong>{" "}
          − Paro programado{" "}
          <strong style={{ color: REPORT_COLORS.scheduled }}>
            {formatDuration(scheduledDowntimeSeconds)}
          </strong>{" "}
          = Productivo planeado{" "}
          <strong className="text-white">
            {formatDuration(plannedProductionSeconds)}
          </strong>
        </p>
        <p>
          Productivo planeado{" "}
          <strong className="text-white">
            {formatDuration(plannedProductionSeconds)}
          </strong>{" "}
          − Paro no programado{" "}
          <strong style={{ color: REPORT_COLORS.unplanned }}>
            {formatDuration(unplannedDowntimeSeconds)}
          </strong>{" "}
          = Tiempo corriendo{" "}
          <strong style={{ color: REPORT_COLORS.run }}>
            {formatDuration(runSeconds)}
          </strong>
        </p>
      </div>
    </div>
  );
}

function Segment({
  color,
  label,
  widthPercent,
}: {
  color: string;
  label: string;
  widthPercent: number;
}) {
  if (widthPercent <= 0) return null;

  return (
    <div
      className="flex items-center justify-center text-xs text-white/90 overflow-hidden whitespace-nowrap"
      style={{ width: `${widthPercent}%`, backgroundColor: color }}
      title={`${label}: ${widthPercent.toFixed(1)}%`}
    >
      {widthPercent > 8 ? label : ""}
    </div>
  );
}

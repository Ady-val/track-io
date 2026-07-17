import { useCallback, useState } from "react";

import { DowntimeParetoChart } from "@/components/organisms/reports/DowntimeParetoChart";
import { DowntimeTrendChart } from "@/components/organisms/reports/DowntimeTrendChart";
import { EventTraceTable } from "@/components/organisms/reports/EventTraceTable";
import {
  ReportFilters,
  type ReportFilterValue,
} from "@/components/organisms/reports/ReportFilters";
import { ReportKpiCards } from "@/components/organisms/reports/ReportKpiCards";
import { ResponseResolutionChart } from "@/components/organisms/reports/ResponseResolutionChart";
import { TimeAccountingBar } from "@/components/organisms/reports/TimeAccountingBar";
import {
  useDowntimeReport,
  downloadDowntimeExcel,
} from "@/hooks/useDowntimeReport";
import { useToast } from "@/hooks/useToast";

export function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilterValue | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showScheduled, setShowScheduled] = useState(true);
  const toast = useToast();

  const handleFilterChange = useCallback((value: ReportFilterValue) => {
    setFilters(value);
  }, []);

  const { data, isLoading, isError } = useDowntimeReport(
    filters ?? { from: "", to: "" },
    filters != null
  );
  const report = data?.data;

  const handleExport = async () => {
    if (!filters) return;
    setExporting(true);
    try {
      await downloadDowntimeExcel(filters);
    } catch {
      toast.error("No se pudo generar el Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-auto gap-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Reportes de paros</h1>
        <p className="mt-1 text-slate-400">
          Disponibilidad, trazabilidad y exportación por área y rango.
        </p>
      </div>

      <ReportFilters
        exporting={exporting}
        showScheduled={showScheduled}
        onChange={handleFilterChange}
        onExport={handleExport}
        onShowScheduledChange={setShowScheduled}
      />

      {isLoading && <p className="text-slate-400">Generando reporte…</p>}
      {isError && (
        <p className="text-red-400">
          Ocurrió un error al generar el reporte. Revisa el rango y reintenta.
        </p>
      )}

      {report && (
        <>
          {!report.summary.hasScheduledDowntimeConfigured && (
            <div className="bg-amber-500/15 border border-amber-500/50 rounded-lg p-4">
              <p className="text-amber-300 font-semibold">
                Esta área no tiene paros programados configurados.
              </p>
              <p className="text-amber-200/80 text-sm mt-1">
                La disponibilidad se está calculando contra 24 h/día y no
                refleja el horario real de la línea.{" "}
                <a className="underline" href="/dashboard/catalogs">
                  Configurar →
                </a>
              </p>
            </div>
          )}

          <ReportKpiCards summary={report.summary} />

          <TimeAccountingBar
            showScheduled={showScheduled}
            summary={report.summary}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Paro no programado por departamento
              </h3>
              <DowntimeParetoChart
                data={report.byDepartment.map((d) => ({
                  label: d.departmentName,
                  seconds: d.unplannedDowntimeSeconds,
                }))}
              />
              <p className="text-xs text-slate-500 mt-2">
                La suma por departamento puede superar el paro total de la
                línea: cuando dos departamentos tienen llamadas abiertas al
                mismo tiempo, la línea se detiene una vez pero ambos son
                responsables.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Atención vs solución (promedio por departamento)
              </h3>
              <ResponseResolutionChart
                data={report.byDepartment.map((d) => ({
                  label: d.departmentName,
                  responseSeconds: d.avgResponseSeconds ?? 0,
                  resolutionSeconds: d.avgResolutionSeconds ?? 0,
                }))}
              />
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Tendencia</h3>
            <DowntimeTrendChart
              data={report.trend.map((t) => ({
                bucket: t.bucket,
                scheduledSeconds: t.scheduledDowntimeSeconds,
                unplannedSeconds: t.unplannedDowntimeSeconds,
              }))}
              groupBy={report.range.groupBy}
              showScheduled={showScheduled}
            />
          </div>

          {filters && (
            <EventTraceTable
              areaId={filters.areaId}
              from={filters.from}
              timezone={report.range.timezone}
              to={filters.to}
            />
          )}

          <p className="text-xs text-slate-500 border-t border-slate-800 pt-3">
            El sistema solo mide el paro que alguien reportó con la botonera. El
            paro no reportado no aparece aquí.
          </p>
        </>
      )}
    </div>
  );
}

import { useState } from "react";

import { useEventReport } from "@/hooks/useDowntimeReport";
import { formatDuration, formatPlantTime } from "@/lib/formatDuration";
import type { EventReportRow, EventReportSlice } from "@/types/report";

/** Tope que acepta el endpoint (`GET /reports/events`, limit máximo 100). */
const MAX_ROWS = 100;

/**
 * La transparencia hecha pantalla (§8.7): tabla de eventos con
 * `Duración → Paro programado → Duración real` contiguos y filas expandibles al
 * detalle horario. Horas en HORA DE PLANTA (indicada en el encabezado).
 *
 * Sin paginación: la tabla trae una sola página y se recorre con su propio
 * scroll, con la cabecera fija, para que la tarjeta no crezca sin límite y
 * empuje el resto del reporte fuera de la pantalla.
 */
export function EventTraceTable({
  areaId,
  from,
  to,
  timezone,
}: {
  areaId?: number;
  from: string;
  to: string;
  timezone: string;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const params = areaId
    ? { areaId, from, to, limit: MAX_ROWS, offset: 0 }
    : { from, to, limit: MAX_ROWS, offset: 0 };
  const { data, isLoading } = useEventReport(params);

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">
          Eventos (trazabilidad)
        </h3>
        <span className="text-xs text-slate-400">
          Horas en hora de planta ({timezone})
        </span>
      </div>

      <div className="overflow-auto max-h-[28rem]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="text-left text-slate-400 [&>th]:bg-slate-800 [&>th]:border-b [&>th]:border-slate-700">
              <th className="py-2 pr-3" />
              <th className="py-2 pr-3">Inicio</th>
              <th className="py-2 pr-3">Atendido</th>
              <th className="py-2 pr-3">Cierre</th>
              <th className="py-2 pr-3">Departamento</th>
              <th className="py-2 pr-3">Duración</th>
              <th className="py-2 pr-3">Paro programado</th>
              <th className="py-2 pr-3">Duración real</th>
              <th className="py-2 pr-3">Atención</th>
              <th className="py-2 pr-3">Solución</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="py-4 text-slate-500" colSpan={10}>
                  Cargando…
                </td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td className="py-4 text-slate-500" colSpan={10}>
                  No hay eventos cerrados en el rango
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <EventRow
                key={row.id}
                expanded={expanded === row.id}
                row={row}
                timezone={timezone}
                onToggle={() =>
                  setExpanded(expanded === row.id ? null : row.id)
                }
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-xs text-slate-400">
        {total === 0 ? (
          "0 eventos"
        ) : rows.length < total ? (
          // La tabla no pagina: si el rango trae más eventos de los que el
          // endpoint entrega de una vez, hay que decirlo en vez de mostrar un
          // recorte silencioso que se leería como "esto es todo".
          <span>
            Mostrando los {rows.length} eventos más recientes de {total}. Acota
            el rango o filtra por área para verlos todos.
          </span>
        ) : (
          `${total} ${total === 1 ? "evento" : "eventos"}`
        )}
      </div>
    </div>
  );
}

function EventRow({
  row,
  timezone,
  expanded,
  onToggle,
}: {
  row: EventReportRow;
  timezone: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasDiscount = (row.scheduledDowntimeDiscountSeconds ?? 0) > 0;

  return (
    <>
      <tr className="border-b border-slate-800 text-slate-200">
        <td className="py-2 pr-3">
          {hasDiscount ? (
            <button
              aria-label="Ver detalle"
              className="text-blue-400 w-5"
              type="button"
              onClick={onToggle}
            >
              {expanded ? "▾" : "▸"}
            </button>
          ) : null}
        </td>
        <td className="py-2 pr-3">
          {formatPlantTime(row.createdAt, timezone)}
        </td>
        <td className="py-2 pr-3">
          {formatPlantTime(row.inProgressAt, timezone)}
        </td>
        <td className="py-2 pr-3">{formatPlantTime(row.closedAt, timezone)}</td>
        <td className="py-2 pr-3">{row.departmentName}</td>
        <td className="py-2 pr-3">{formatDuration(row.durationSeconds)}</td>
        <td className="py-2 pr-3" style={{ color: "#898781" }}>
          {hasDiscount
            ? formatDuration(row.scheduledDowntimeDiscountSeconds)
            : "—"}
        </td>
        <td className="py-2 pr-3 font-semibold text-white">
          {formatDuration(row.effectiveDurationSeconds)}
        </td>
        <td className="py-2 pr-3">
          {formatDuration(row.effectiveResponseSeconds)}
        </td>
        <td className="py-2 pr-3">
          {formatDuration(row.effectiveResolutionSeconds)}
        </td>
      </tr>
      {expanded && hasDiscount && (
        <tr className="bg-slate-900/40">
          <td className="py-2 px-6" colSpan={10}>
            <p className="text-xs text-slate-400 mb-1">
              Paros programados aplicados a este evento:
            </p>
            <ul className="space-y-1">
              {row.scheduledDowntimeSlices.map((slice, i) => (
                <li key={i} className="text-sm text-slate-300">
                  {sliceLabel(slice, timezone)}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}

function sliceLabel(slice: EventReportSlice, timezone: string): string {
  const segment = slice.segment === "response" ? "atención" : "solución";

  return (
    `${slice.name} (${slice.configuredStartTime}–${slice.configuredEndTime}) · ` +
    `${formatPlantTime(slice.occurredFrom, timezone)} → ` +
    `${formatPlantTime(slice.occurredTo, timezone)} · ` +
    `${formatDuration(slice.seconds)} · durante la ${segment}`
  );
}

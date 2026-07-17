import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api";
import type {
  DowntimeReportResponse,
  EventReportResponse,
  DowntimeReportParams,
  EventReportParams,
} from "@/types/report";

const reportApi = {
  getDowntimeReport: async (params: DowntimeReportParams) => {
    const response = await apiClient.get<DowntimeReportResponse>(
      "/reports/downtime",
      { params }
    );

    return response.data;
  },
  getEventReport: async (params: EventReportParams) => {
    const response = await apiClient.get<EventReportResponse>(
      "/reports/events",
      { params }
    );

    return response.data;
  },
};

/** Reporte agregado (KPIs, Pareto, tendencia). `enabled` evita pedir sin rango. */
export function useDowntimeReport(
  params: DowntimeReportParams,
  enabled = true
) {
  return useQuery({
    queryKey: ["reports", "downtime", params],
    queryFn: () => reportApi.getDowntimeReport(params),
    enabled: enabled && Boolean(params.from) && Boolean(params.to),
  });
}

/** Tabla de eventos (trazabilidad, paginada). */
export function useEventReport(params: EventReportParams, enabled = true) {
  return useQuery({
    queryKey: ["reports", "events", params],
    queryFn: () => reportApi.getEventReport(params),
    enabled: enabled && Boolean(params.from) && Boolean(params.to),
  });
}

/**
 * Descarga el Excel del reporte. El backend arma el archivo; aquí solo se
 * dispara la descarga a partir del blob.
 */
export async function downloadDowntimeExcel(
  params: DowntimeReportParams
): Promise<void> {
  const response = await apiClient.get("/reports/downtime/export", {
    params,
    responseType: "blob",
  });

  const disposition = String(response.headers["content-disposition"] ?? "");
  const match = /filename="?([^"]+)"?/.exec(disposition);
  const areaLabel = params.areaId ? `area${params.areaId}` : "todas";
  const filename =
    match?.[1] ??
    `paros_${areaLabel}_${params.from.slice(0, 10)}_${params.to.slice(0, 10)}.xlsx`;

  const blob = new Blob([response.data as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

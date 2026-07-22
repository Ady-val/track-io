import type { TooltipItem } from "chart.js";

import {
  Chart as ChartJS,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";

import { formatDuration } from "@/lib/formatDuration";
import type { GroupBy } from "@/types/report";

import { REPORT_COLORS } from "./reportColors";

ChartJS.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export interface DowntimeTrendChartProps {
  data: Array<{
    bucket: string;
    unplannedSeconds: number;
    availability: number | null;
    // Solo para el tooltip — el paro programado no se dibuja (§C2).
    scheduledSeconds: number;
    plannedProductionSeconds: number;
    calendarSeconds: number;
  }>;
  groupBy: GroupBy;
  loading?: boolean;
}

/**
 * Tendencia: barras de paro NO programado (lo único que importa ver
 * evolucionar día a día) + línea de disponibilidad sobre eje derecho. Los
 * buckets sin tiempo productivo planeado (fin de semana) dejan hueco en la
 * línea — `spanGaps: false` — en vez de aplastar la escala con paro
 * programado. El paro programado no se pierde: va en el tooltip.
 * Componente TONTO: el bucketing y la agregación son del backend (§8.3).
 */
export function DowntimeTrendChart({
  data,
  groupBy,
  loading,
}: DowntimeTrendChartProps) {
  if (loading) {
    return <Placeholder text="Cargando…" />;
  }
  if (data.length === 0) {
    return <Placeholder text="Sin datos en el rango" />;
  }

  const unit =
    groupBy === "month" ? "mes" : groupBy === "week" ? "semana" : "día";

  return (
    <div className="h-80">
      <Chart
        data={{
          labels: data.map((d) => d.bucket),
          datasets: [
            {
              type: "bar" as const,
              label: "Paro no programado",
              data: data.map((d) => d.unplannedSeconds),
              backgroundColor: REPORT_COLORS.unplanned,
              yAxisID: "y",
              order: 2,
            },
            {
              type: "line" as const,
              label: "Disponibilidad",
              data: data.map((d) =>
                d.availability == null ? null : d.availability * 100
              ),
              borderColor: REPORT_COLORS.run,
              backgroundColor: REPORT_COLORS.run,
              yAxisID: "y1",
              spanGaps: false,
              tension: 0.2,
              order: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { color: "#cbd5e1" } },
            title: {
              display: true,
              text: `Por ${unit}`,
              color: "#94a3b8",
            },
            tooltip: {
              callbacks: {
                label: (ctx: TooltipItem<"bar" | "line">) => {
                  if (ctx.dataset.type === "line") {
                    const value = ctx.raw as number | null;

                    return value == null
                      ? "Disponibilidad: sin tiempo productivo planeado"
                      : `Disponibilidad: ${value.toFixed(1)}%`;
                  }

                  return `Paro no programado: ${formatDuration(Number(ctx.raw))}`;
                },
                afterBody: (items: Array<TooltipItem<"bar" | "line">>) => {
                  const index = items[0]?.dataIndex;
                  const bucket = index == null ? undefined : data[index];

                  if (!bucket) return [];

                  return [
                    `Calendario: ${formatDuration(bucket.calendarSeconds)}`,
                    `Paro programado: ${formatDuration(bucket.scheduledSeconds)}`,
                    `Productivo planeado: ${formatDuration(bucket.plannedProductionSeconds)}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "#94a3b8" },
              grid: { color: "#334155" },
            },
            y: {
              position: "left",
              ticks: {
                color: "#94a3b8",
                callback: (v) => formatDuration(Number(v)),
              },
              grid: { color: "#334155" },
            },
            y1: {
              position: "right",
              min: 0,
              max: 100,
              ticks: { color: "#94a3b8", callback: (v) => `${v}%` },
              grid: { drawOnChartArea: false },
            },
          },
        }}
        type="bar"
      />
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="h-80 flex items-center justify-center text-slate-500 text-sm">
      {text}
    </div>
  );
}

import {
  Chart as ChartJS,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import { formatDuration } from "@/lib/formatDuration";
import type { GroupBy } from "@/types/report";

import { REPORT_COLORS } from "./reportColors";

ChartJS.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export interface DowntimeTrendChartProps {
  data: Array<{
    bucket: string;
    scheduledSeconds: number;
    unplannedSeconds: number;
  }>;
  groupBy: GroupBy;
  loading?: boolean;
  showScheduled?: boolean;
}

/**
 * Tendencia: barras apiladas por bucket (programado vs no programado).
 * Componente TONTO: el bucketing y la agregación son del backend (§8.3).
 */
export function DowntimeTrendChart({
  data,
  groupBy,
  loading,
  showScheduled = true,
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
      <Bar
        data={{
          labels: data.map((d) => d.bucket),
          datasets: [
            {
              label: "Paro programado",
              data: data.map((d) => d.scheduledSeconds),
              backgroundColor: REPORT_COLORS.scheduled,
              hidden: !showScheduled,
            },
            {
              label: "Paro no programado",
              data: data.map((d) => d.unplannedSeconds),
              backgroundColor: REPORT_COLORS.unplanned,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#cbd5e1" } },
            title: {
              display: true,
              text: `Por ${unit}`,
              color: "#94a3b8",
            },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  `${ctx.dataset.label}: ${formatDuration(Number(ctx.raw))}`,
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              ticks: { color: "#94a3b8" },
              grid: { color: "#334155" },
            },
            y: {
              stacked: true,
              ticks: {
                color: "#94a3b8",
                callback: (v) => formatDuration(Number(v)),
              },
              grid: { color: "#334155" },
            },
          },
        }}
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

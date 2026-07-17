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

export interface DowntimeParetoChartProps {
  data: Array<{ label: string; seconds: number; cumulativePercent: number }>;
  loading?: boolean;
}

/**
 * Pareto por departamento: barras (paro no programado, desc) + línea de
 * acumulado. Componente TONTO: solo pinta las props que recibe (§8.3).
 */
export function DowntimeParetoChart({
  data,
  loading,
}: DowntimeParetoChartProps) {
  if (loading) {
    return <ChartPlaceholder text="Cargando…" />;
  }
  if (data.length === 0) {
    return <ChartPlaceholder text="Sin paros no programados en el rango" />;
  }

  return (
    <div className="h-80">
      <Chart
        data={{
          labels: data.map((d) => d.label),
          datasets: [
            {
              type: "bar" as const,
              label: "Paro no programado",
              data: data.map((d) => d.seconds),
              backgroundColor: REPORT_COLORS.unplanned,
              yAxisID: "y",
              order: 2,
            },
            {
              type: "line" as const,
              label: "Acumulado %",
              data: data.map((d) => d.cumulativePercent),
              borderColor: REPORT_COLORS.cumulative,
              backgroundColor: REPORT_COLORS.cumulative,
              yAxisID: "y1",
              tension: 0.2,
              order: 1,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#cbd5e1" } },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ctx.dataset.type === "line"
                    ? `Acumulado: ${Number(ctx.raw).toFixed(1)}%`
                    : `Paro: ${formatDuration(Number(ctx.raw))}`,
              },
            },
          },
          scales: {
            x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
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

function ChartPlaceholder({ text }: { text: string }) {
  return (
    <div className="h-80 flex items-center justify-center text-slate-500 text-sm">
      {text}
    </div>
  );
}

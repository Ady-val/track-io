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

import { niceTimeStepSeconds } from "./chartAxis";
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
  data: Array<{ label: string; seconds: number }>;
  loading?: boolean;
}

/**
 * Pareto por departamento: barras (paro no programado, desc). Componente
 * TONTO: solo pinta las props que recibe (§8.3).
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

  const maxSeconds = Math.max(0, ...data.map((d) => d.seconds));
  const stepSize = niceTimeStepSeconds(maxSeconds);

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
                label: (ctx) => `Paro: ${formatDuration(Number(ctx.raw))}`,
              },
            },
          },
          scales: {
            x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
            y: {
              position: "left",
              beginAtZero: true,
              ticks: {
                stepSize,
                color: "#94a3b8",
                callback: (v) => formatDuration(Number(v)),
              },
              grid: { color: "#334155" },
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

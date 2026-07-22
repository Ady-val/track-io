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

import { niceTimeStepSeconds } from "./chartAxis";
import { REPORT_COLORS } from "./reportColors";

ChartJS.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export interface ResponseResolutionChartProps {
  data: Array<{
    label: string;
    responseSeconds: number;
    resolutionSeconds: number;
  }>;
  loading?: boolean;
}

/**
 * Atención vs solución por departamento: barras horizontales apiladas.
 * Responde *por qué tardó*: no llegaron (atención) o llegaron y no pudieron
 * arreglarlo (solución). Componente TONTO (§8.3).
 */
export function ResponseResolutionChart({
  data,
  loading,
}: ResponseResolutionChartProps) {
  if (loading) {
    return <Placeholder text="Cargando…" />;
  }
  if (data.length === 0) {
    return <Placeholder text="Sin datos de atención/solución en el rango" />;
  }

  const maxSeconds = Math.max(
    0,
    ...data.map((d) => d.responseSeconds + d.resolutionSeconds)
  );
  const stepSize = niceTimeStepSeconds(maxSeconds);

  return (
    <div className="h-80">
      <Bar
        data={{
          labels: data.map((d) => d.label),
          datasets: [
            {
              label: "Atención",
              data: data.map((d) => d.responseSeconds),
              backgroundColor: REPORT_COLORS.response,
            },
            {
              label: "Solución",
              data: data.map((d) => d.resolutionSeconds),
              backgroundColor: REPORT_COLORS.resolution,
            },
          ],
        }}
        options={{
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: "#cbd5e1" } },
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
              beginAtZero: true,
              ticks: {
                stepSize,
                color: "#94a3b8",
                callback: (v) => formatDuration(Number(v)),
              },
              grid: { color: "#334155" },
            },
            y: {
              stacked: true,
              ticks: { color: "#94a3b8" },
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

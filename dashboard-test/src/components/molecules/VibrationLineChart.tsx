import { useEffect, useRef } from "react";
import type React from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

import { Card, CardBody, Text } from "@components/atoms";

import { getMeasurementConfig, getDynamicColor } from "@/lib/measurementUtils";
import type { MeasurementType } from "@/types/dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

export interface VibrationLineChartProps {
  title: string;
  subtitle: string;
  value: number | undefined;
  minValue: number;
  maxValue: number;
  type: MeasurementType;
  timestamp?: string;
  history?: number[];
}

export const VibrationLineChart: React.FC<VibrationLineChartProps> = ({
  title,
  subtitle,
  value,
  minValue,
  maxValue,
  type,
  timestamp,
  history = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);
  const config = getMeasurementConfig(type);
  const Icon = config.icon;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const existingChart = ChartJS.getChart(ctx);

    if (existingChart) {
      existingChart.destroy();
    }

    const initialData = Array(30).fill(parseFloat(minValue.toString()));
    const labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);

    const chartConfig: ChartConfiguration<"line"> = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Vibration",
            data: initialData,
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.2)",
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "#06b6d4",
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                return `Valor: ${context.parsed.y?.toFixed(2) ?? "0.00"} ${config.unit}`;
              },
            },
          },
          annotation: {
            annotations: {
              minLine: {
                type: "line",
                yMin: parseFloat(minValue.toString()),
                yMax: parseFloat(minValue.toString()),
                borderColor: "rgba(251, 191, 36, 0.8)",
                borderWidth: 2,
                borderDash: [5, 5],
              },
              midLine: {
                type: "line",
                yMin:
                  (parseFloat(minValue.toString()) +
                    parseFloat(maxValue.toString())) /
                  2,
                yMax:
                  (parseFloat(minValue.toString()) +
                    parseFloat(maxValue.toString())) /
                  2,
                borderColor: "rgba(34, 197, 94, 0.8)",
                borderWidth: 2,
                borderDash: [5, 5],
              },
              maxLine: {
                type: "line",
                yMin: parseFloat(maxValue.toString()),
                yMax: parseFloat(maxValue.toString()),
                borderColor: "rgba(239, 68, 68, 0.8)",
                borderWidth: 2,
                borderDash: [5, 5],
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
              drawOnChartArea: true,
              drawTicks: true,
            },
            ticks: {
              display: false,
            },
          },
          y: {
            display: true,
            min: parseFloat(minValue.toString()),
            max: parseFloat(maxValue.toString()),
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
              drawOnChartArea: true,
              drawTicks: true,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              font: {
                size: 10,
              },
              callback: function (value: number | string) {
                const min = parseFloat(minValue.toString());
                const max = parseFloat(maxValue.toString());
                const mid = (min + max) / 2;
                const numValue =
                  typeof value === "number" ? value : parseFloat(value);

                if (Math.abs(numValue - min) < 0.01) {
                  return min.toFixed(1);
                } else if (Math.abs(numValue - mid) < 0.01) {
                  return mid.toFixed(1);
                } else if (Math.abs(numValue - max) < 0.01) {
                  return max.toFixed(1);
                }

                return "";
              },
            },
          },
        },
        animation: {
          duration: 0,
        },
      },
    };

    try {
      chartRef.current = new ChartJS(ctx, chartConfig);
    } catch (error) {
      console.error("Error creating chart:", error);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [minValue, maxValue, config.unit]);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const recentHistory = [...history].slice(-30);
    const dynamicColor = getDynamicColor(
      value ?? 0,
      minValue,
      maxValue,
      config.color
    );

    if (chartRef.current.data.datasets[0]) {
      chartRef.current.data.datasets[0].data = recentHistory;
      chartRef.current.data.datasets[0].borderColor = dynamicColor;
      chartRef.current.data.datasets[0].backgroundColor = dynamicColor + "20";
      chartRef.current.update("none");
    }
  }, [history, minValue, maxValue, config.color, value]);

  const getValueColor = () => {
    if (value === undefined) return "text-slate-400";

    const min = parseFloat(minValue.toString());
    const max = parseFloat(maxValue.toString());

    if (value < min || value > max) return "text-red-400";

    return "text-slate-100";
  };

  const hasValue = value !== undefined;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardBody className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0">
              <div style={{ color: config.color }}>
                <Icon className="w-4 h-4" />
              </div>
              <Text className="text-lg font-semibold text-slate-100">
                {title}
              </Text>
            </div>
            <Text
              className="text-xs text-slate-400"
              color="muted"
              variant="caption"
            >
              {subtitle}
            </Text>
          </div>
        </div>

        <div className="w-full h-24 mb-3">
          <canvas ref={canvasRef} />
        </div>

        <div className="flex justify-center mb-3">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getValueColor()}`}>
              {hasValue ? value.toFixed(2) : "N/A"}
            </div>
            <div className="text-lg text-slate-400">
              {hasValue ? config.unit : ""}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-base">
          <div className="text-slate-400">
            Min:{" "}
            <span className="text-slate-200 font-bold text-lg">
              {parseFloat(minValue.toString())}
            </span>
          </div>
          <div className="text-slate-400">
            Max:{" "}
            <span className="text-slate-200 font-bold text-lg">
              {parseFloat(maxValue.toString())}
            </span>
          </div>
        </div>

        <div className="mt-1 text-center">
          <Text className="text-xs text-slate-500" variant="caption">
            {hasValue && timestamp
              ? `Actualizado: ${new Date(timestamp).toLocaleTimeString()}`
              : "Esperando señal"}
          </Text>
        </div>
      </CardBody>
    </Card>
  );
};

import { useEffect, useRef } from "react";
import type React from "react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  type ChartConfiguration,
} from "chart.js";

import { Card, CardBody, Text } from "@components/atoms";

import { getMeasurementConfig, getDynamicColor } from "@/lib/measurementUtils";
import type { MeasurementType } from "@/types/dashboard";

ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

export interface LevelChartProps {
  title: string;
  subtitle: string;
  value: number | undefined;
  minValue: number;
  maxValue: number;
  type: MeasurementType;
  timestamp?: string;
}

export const LevelChart: React.FC<LevelChartProps> = ({
  title,
  subtitle,
  value,
  minValue,
  maxValue,
  type,
  timestamp,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);
  const config = getMeasurementConfig(type);
  const Icon = config.icon;

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) return;

    if (chartRef.current) return;

    const chartConfig: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [0, 100], // Empezar en 0
            backgroundColor: [config.color, "rgba(100, 116, 139, 0.2)"],
            borderWidth: 3,
            borderColor: config.color,
            circumference: 360,
            rotation: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "60%",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
          },
        },
        animation: {
          animateRotate: true,
          animateScale: false,
          duration: 800,
        },
      },
    };

    try {
      chartRef.current = new ChartJS(ctx, chartConfig);
    } catch (error) {
      console.error("Error creating level chart:", error);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const min = parseFloat(minValue.toString());
    const max = parseFloat(maxValue.toString());
    const clampedValue =
      value !== undefined ? Math.max(min, Math.min(max, value)) : 0;
    const range = max - min;
    const percentage =
      range > 0 && value !== undefined
        ? ((clampedValue - min) / range) * 100
        : 0;

    const dynamicColor = getDynamicColor(value ?? 0, min, max, config.color);

    if (chartRef.current?.data?.datasets?.[0]) {
      chartRef.current.data.datasets[0].data = [percentage, 100 - percentage];
      chartRef.current.data.datasets[0].backgroundColor = [
        dynamicColor,
        "rgba(100, 116, 139, 0.2)",
      ];
      chartRef.current.data.datasets[0].borderColor = dynamicColor;
      chartRef.current.update();
    }
  }, [value, minValue, maxValue]);

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

        <div className="relative mb-3 flex justify-center">
          <div className="w-56 h-56">
            <canvas ref={canvasRef} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="text-center"
              style={{ transform: "translateY(-4px)" }}
            >
              <div className={`text-3xl font-bold ${getValueColor()}`}>
                {hasValue ? value.toFixed(1) : "N/A"}
              </div>
              <div className="text-sm text-slate-400">
                {hasValue ? config.unit : ""}
              </div>
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

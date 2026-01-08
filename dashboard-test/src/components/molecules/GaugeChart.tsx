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
import { FaEdit, FaTrash } from "react-icons/fa";

import { Card, CardBody, Text } from "@components/atoms";

import { useAdaptiveTitleSize } from "@/hooks/useAdaptiveTitleSize";
import { getMeasurementConfig, getDynamicColor } from "@/lib/measurementUtils";
import type { MeasurementType } from "@/types/dashboard";

ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

export interface GaugeChartProps {
  title: string;
  subtitle: string;
  value: number | undefined;
  minValue: number;
  maxValue: number;
  type: MeasurementType;
  timestamp?: string;
  degrees?: number; // 180 o 270 grados
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  title,
  subtitle,
  value,
  minValue,
  maxValue,
  type,
  timestamp,
  degrees = 180,
  onEdit,
  onDelete,
  showActions = false,
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
            data: [0, 100],
            backgroundColor: [config.color, "rgba(100, 116, 139, 0.1)"],
            borderWidth: 0,
            circumference: degrees,
            rotation: degrees === 270 ? 225 : 270,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
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
      console.error("Error creating chart:", error);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [config.color, degrees]);

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

    if (chartRef.current.data.datasets[0]) {
      chartRef.current.data.datasets[0].data = [percentage, 100 - percentage];
      chartRef.current.data.datasets[0].backgroundColor = [
        dynamicColor,
        "rgba(100, 116, 139, 0.1)",
      ];
    }

    chartRef.current.update();
  }, [value, minValue, maxValue, config.color]);

  const getValueColor = () => {
    if (value === undefined) {
      return "text-slate-400";
    }
    const min = parseFloat(minValue.toString());
    const max = parseFloat(maxValue.toString());

    if (value < min || value > max) {
      return "text-red-400";
    }

    return "text-slate-100";
  };

  const hasValue = value !== undefined;
  const { titleRef, titleClassName } = useAdaptiveTitleSize({
    title,
    baseSize: "lg",
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700 group relative">
      <CardBody className="p-6">
        {showActions && (onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {onEdit && (
              <button
                aria-label="Editar"
                className="w-7 h-7 rounded bg-yellow-600/80 hover:bg-yellow-600 text-white flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <FaEdit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                aria-label="Eliminar"
                className="w-7 h-7 rounded bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <FaTrash className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0 min-w-0">
              <div className="flex-shrink-0" style={{ color: config.color }}>
                <Icon className="w-4 h-4" />
              </div>
              <div ref={titleRef} className={titleClassName}>
                {title}
              </div>
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

        <div className="grow relative mb-3 flex items-center justify-center min-h-[220px] w-full overflow-hidden">
          <div className="relative w-full h-full max-w-[320px] max-h-[176px] flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getValueColor()}`}>
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
              ? `Actualizado: ${new Date(timestamp).toLocaleDateString()} ${new Date(timestamp).toLocaleTimeString()}`
              : "Esperando señal"}
          </Text>
        </div>
      </CardBody>
    </Card>
  );
};

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
import { formatLocalDateTime } from "@/lib/dateTime";

import { useAdaptiveTitleSize } from "@/hooks/useAdaptiveTitleSize";
import { getMeasurementConfig } from "@/lib/measurementUtils";
import type { MeasurementType } from "@/types/dashboard";

ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

/**
 * Calcula un color interpolado para el gauge chart basado en el valor actual.
 * Usa interpolación segmentada con múltiples colores:
 * - 0-25%: azul → amarillo
 * - 25-50%: amarillo → naranja
 * - 50-75%: naranja → rojo
 * - 75-100%: rojo → rojo más intenso
 *
 * @param value - Valor actual a representar
 * @param min - Valor mínimo del rango
 * @param max - Valor máximo del rango
 * @returns Color en formato rgb() interpolado entre múltiples colores
 */
export const getGaugeColor = (
  value: number | undefined,
  min: number,
  max: number
): string => {
  // Si no hay valor, retornar un color gris neutro
  if (value === undefined || value === null) {
    return "rgb(148, 163, 184)"; // slate-400
  }

  const minValue = parseFloat(min.toString());
  const maxValue = parseFloat(max.toString());
  const range = maxValue - minValue;

  // Si el rango es inválido, retornar color por defecto
  if (range <= 0) {
    return "rgb(148, 163, 184)";
  }

  // Normalizar el valor entre 0 y 1, con clamp
  const normalized = Math.max(0, Math.min(1, (value - minValue) / range));

  // Definir los colores neon en cada punto de control
  const colors = [
    { r: 0, g: 255, b: 255 }, // Azul/Cyan neon (0%)
    { r: 255, g: 255, b: 0 }, // Amarillo neon (25%)
    { r: 255, g: 140, b: 0 }, // Naranja neon (50%)
    { r: 255, g: 0, b: 100 }, // Rojo/Rosa neon (75%)
    { r: 255, g: 0, b: 0 }, // Rojo intenso (100%)
  ];

  // Determinar en qué segmento estamos y calcular la interpolación
  let startColor: { r: number; g: number; b: number };
  let endColor: { r: number; g: number; b: number };
  let segmentNormalized: number;

  if (normalized <= 0.25) {
    // 0-25%: azul → amarillo
    startColor = colors[0];
    endColor = colors[1];
    segmentNormalized = normalized / 0.25; // Normalizar dentro del segmento (0-1)
  } else if (normalized <= 0.5) {
    // 25-50%: amarillo → naranja
    startColor = colors[1];
    endColor = colors[2];
    segmentNormalized = (normalized - 0.25) / 0.25; // Normalizar dentro del segmento (0-1)
  } else if (normalized <= 0.75) {
    // 50-75%: naranja → rojo
    startColor = colors[2];
    endColor = colors[3];
    segmentNormalized = (normalized - 0.5) / 0.25; // Normalizar dentro del segmento (0-1)
  } else {
    // 75-100%: rojo → rojo más intenso
    startColor = colors[3];
    endColor = colors[4];
    segmentNormalized = (normalized - 0.75) / 0.25; // Normalizar dentro del segmento (0-1)
  }

  // Interpolación lineal dentro del segmento
  const r = Math.round(
    startColor.r + (endColor.r - startColor.r) * segmentNormalized
  );
  const g = Math.round(
    startColor.g + (endColor.g - startColor.g) * segmentNormalized
  );
  const b = Math.round(
    startColor.b + (endColor.b - startColor.b) * segmentNormalized
  );

  return `rgb(${r}, ${g}, ${b})`;
};

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
  const previousPercentageRef = useRef<number>(0);
  const config = getMeasurementConfig(type);
  const Icon = config.icon;

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) return;

    if (chartRef.current) return;

    const min = parseFloat(minValue.toString());
    const max = parseFloat(maxValue.toString());
    // Usar color interpolado inicial si hay un valor, sino usar color por defecto
    const initialColor =
      value !== undefined
        ? getGaugeColor(value, min, max)
        : "rgb(148, 163, 184)";

    // Calcular porcentaje inicial
    const clampedValue =
      value !== undefined ? Math.max(min, Math.min(max, value)) : 0;
    const range = max - min;
    const initialPercentage =
      range > 0 && value !== undefined
        ? ((clampedValue - min) / range) * 100
        : 0;

    // Guardar el porcentaje inicial
    previousPercentageRef.current = initialPercentage;

    const chartConfig: ChartConfiguration<"doughnut"> = {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [initialPercentage, 100 - initialPercentage],
            backgroundColor: [initialColor, "rgba(100, 116, 139, 0.1)"],
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
  }, [degrees, minValue, maxValue]);

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

    // Usar interpolación de color dinámica basada en el valor
    const gaugeColor = getGaugeColor(value, min, max);

    if (chartRef.current.data.datasets[0]) {
      chartRef.current.data.datasets[0].data = [percentage, 100 - percentage];
      chartRef.current.data.datasets[0].backgroundColor = [
        gaugeColor,
        "rgba(100, 116, 139, 0.1)",
      ];
    }

    chartRef.current.update();
  }, [value, minValue, maxValue]);

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

  const formattedTimestamp = formatLocalDateTime(timestamp);

  return (
    <Card className="h-[25rem] w-[25rem] bg-slate-800/50 border-slate-700 group relative">
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
            {hasValue && formattedTimestamp
              ? `Actualizado: ${formattedTimestamp}`
              : "Esperando señal"}
          </Text>
        </div>
      </CardBody>
    </Card>
  );
};

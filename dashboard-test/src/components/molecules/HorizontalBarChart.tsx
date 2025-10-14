import type React from "react";

import { Card, CardBody, Text } from "@components/atoms";

import { getMeasurementConfig, getDynamicColor } from "@/lib/measurementUtils";
import type { MeasurementType } from "@/types/dashboard";

export interface HorizontalBarChartProps {
  title: string;
  subtitle: string;
  value: number | undefined;
  minValue: number;
  maxValue: number;
  type: MeasurementType;
  timestamp?: string;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  title,
  subtitle,
  value,
  minValue,
  maxValue,
  type,
  timestamp,
}) => {
  const config = getMeasurementConfig(type);
  const Icon = config.icon;

  // Convertir a números y calcular los tres indicadores
  const min = parseFloat(minValue.toString());
  const max = parseFloat(maxValue.toString());
  const range = max - min;
  const indicator1 = min + range * 0.25; // 25%
  const indicator2 = min + range * 0.5; // 50%
  const indicator3 = min + range * 0.75; // 75%

  // Calcular posición del valor actual
  const clampedValue =
    value !== undefined ? Math.max(min, Math.min(max, value)) : 0;
  const valuePosition =
    value !== undefined ? ((clampedValue - min) / range) * 100 : 0;

  // Determinar color del valor
  const getValueColor = () => {
    if (value === undefined) return "text-slate-400";
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

        <div className="grow relative mb-3 flex flex-col items-center justify-center">
          <div className="w-64">
            <div className="relative h-6 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="absolute top-0 h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${valuePosition}%`,
                  backgroundColor: getDynamicColor(
                    value ?? 0,
                    min,
                    max,
                    config.color
                  ),
                }}
              />
            </div>

            <div className="relative mt-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{min.toFixed(1)}</span>
                <span>{indicator1.toFixed(1)}</span>
                <span>{indicator2.toFixed(1)}</span>
                <span>{indicator3.toFixed(1)}</span>
                <span>{max.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-2">
            <div className="text-center">
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
            Min: <span className="text-slate-200 font-bold text-lg">{min}</span>
          </div>
          <div className="text-slate-400">
            Max: <span className="text-slate-200 font-bold text-lg">{max}</span>
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

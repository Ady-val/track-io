import type React from "react";

import {
  FaTemperatureHalf,
  FaDroplet,
  FaGaugeHigh,
  FaArrowsUpDown,
  FaWater,
  FaWaveSquare,
  FaChartLine,
  FaPowerOff,
} from "react-icons/fa6";

import type { MeasurementType } from "@/types/dashboard";

export interface MeasurementConfig {
  icon: React.ComponentType<{ className?: string }>;
  unit: string;
  formatValue: (value: number | boolean) => string;
  color: string;
  bgColor: string;
}

export const MEASUREMENT_CONFIGS: Record<MeasurementType, MeasurementConfig> = {
  temperature: {
    icon: FaTemperatureHalf,
    unit: "°C",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? `${value.toFixed(1)}°C` : "N/A",
    color: "#ef4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
  humidity: {
    icon: FaDroplet,
    unit: "%",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? `${value.toFixed(1)}%` : "N/A",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  dew_point: {
    icon: FaTemperatureHalf,
    unit: "°C",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? `${value.toFixed(1)}°C` : "N/A",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  ppm: {
    icon: FaDroplet,
    unit: "PPM",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? `${value.toFixed(1)} PPM` : "N/A",
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  pressure: {
    icon: FaGaugeHigh,
    unit: "Pa",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? `${value.toFixed(2)} Pa` : "N/A",
    color: "#8b5cf6",
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  level: {
    icon: FaArrowsUpDown,
    unit: "",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? value.toFixed(2) : "N/A",
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.1)",
  },
  flow: {
    icon: FaWater,
    unit: "L/s",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? `${value.toFixed(2)} L/s` : "N/A",
    color: "#06b6d4",
    bgColor: "rgba(6, 182, 212, 0.1)",
  },
  vibration: {
    icon: FaWaveSquare,
    unit: "Hz",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? `${value.toFixed(2)} Hz` : "N/A",
    color: "#06b6d4",
    bgColor: "rgba(6, 182, 212, 0.1)",
  },
  shape: {
    icon: FaChartLine,
    unit: "mm",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? `${value.toFixed(2)}mm` : "N/A",
    color: "#6366f1",
    bgColor: "rgba(99, 102, 241, 0.1)",
  },
  totalizador: {
    icon: FaChartLine,
    unit: "L",
    formatValue: (value: number | boolean) =>
      typeof value === "number" ? `${value.toFixed(1)}L` : "N/A",
    color: "#84cc16",
    bgColor: "rgba(132, 204, 22, 0.1)",
  },
  status: {
    icon: FaPowerOff,
    unit: "",
    formatValue: (value: number | boolean) => {
      if (typeof value === "boolean") {
        return value ? "ON" : "OFF";
      }

      return value !== 0 ? "ON" : "OFF";
    },
    color: "#10b981",
    bgColor: "rgba(16, 185, 129, 0.1)",
  },
};

export const getMeasurementConfig = (
  type: MeasurementType
): MeasurementConfig => {
  return MEASUREMENT_CONFIGS[type] || MEASUREMENT_CONFIGS.level;
};

export const getDynamicColor = (
  value: number,
  minValue: number,
  maxValue: number,
  originalColor: string
): string => {
  if (value === undefined || value === null) {
    return "#94a3b8"; // Gris suave (slate-400)
  }

  const min = parseFloat(minValue.toString());
  const max = parseFloat(maxValue.toString());
  const range = max - min;

  if (range <= 0) return originalColor;

  const normalizedValue = (value - min) / range;

  if (normalizedValue >= 0 && normalizedValue <= 0.2) {
    return "#ef4444"; // Rojo
  }

  if (
    (normalizedValue > 0.2 && normalizedValue <= 0.25) ||
    (normalizedValue >= 0.75 && normalizedValue < 1)
  ) {
    return "#f59e0b"; // Amarillo
  }

  if (normalizedValue >= 0.8 && normalizedValue <= 1) {
    return "#ef4444"; // Rojo
  }

  return originalColor;
};

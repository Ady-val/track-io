import type { MeasurementType } from "@/types/dashboard";
import {
  FaTemperatureHalf,
  FaDroplet,
  FaGaugeHigh,
  FaArrowsUpDown,
  FaWater,
  FaWaveSquare,
} from "react-icons/fa6";

export interface MeasurementConfig {
  icon: React.ComponentType<{ className?: string }>;
  unit: string;
  formatValue: (value: number) => string;
  color: string;
  bgColor: string;
}

export const MEASUREMENT_CONFIGS: Record<MeasurementType, MeasurementConfig> = {
  temperature: {
    icon: FaTemperatureHalf,
    unit: "°C",
    formatValue: (value: number) => `${value.toFixed(1)}°C`,
    color: "#ef4444", // Rojo original
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
  humidity: {
    icon: FaDroplet,
    unit: "%",
    formatValue: (value: number) => `${value.toFixed(1)}%`,
    color: "#3b82f6", // Azul original
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  pressure: {
    icon: FaGaugeHigh,
    unit: "Pa",
    formatValue: (value: number) => `${value.toFixed(2)} Pa`,
    color: "#8b5cf6", // Púrpura original
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  level: {
    icon: FaArrowsUpDown,
    unit: "",
    formatValue: (value: number) => value.toFixed(2),
    color: "#10b981", // Verde original
    bgColor: "rgba(16, 185, 129, 0.1)",
  },
  flow: {
    icon: FaWater,
    unit: "L/s",
    formatValue: (value: number) => `${value.toFixed(2)} L/s`,
    color: "#06b6d4", // Cyan original
    bgColor: "rgba(6, 182, 212, 0.1)",
  },
  vibration: {
    icon: FaWaveSquare,
    unit: "Hz",
    formatValue: (value: number) => `${value.toFixed(2)} Hz`,
    color: "#06b6d4", // Azul cyan original
    bgColor: "rgba(6, 182, 212, 0.1)",
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

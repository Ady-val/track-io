import type React from "react";
import { GaugeChart } from "./GaugeChart";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { LevelChart } from "./LevelChart";
import { VibrationLineChart } from "./VibrationLineChart";
import type { MeasurementType } from "@/types/dashboard";

export interface MeasurementChartProps {
  title: string;
  subtitle: string;
  value: number | undefined;
  minValue: number;
  maxValue: number;
  type: MeasurementType;
  timestamp?: string;
  history?: number[];
}

export const MeasurementChart: React.FC<MeasurementChartProps> = ({
  title,
  subtitle,
  value,
  minValue,
  maxValue,
  type,
  timestamp,
  history,
}) => {
  // Factory para renderizar el chart correcto según el tipo
  switch (type) {
    case "temperature":
    case "humidity":
      return (
        <GaugeChart
          title={title}
          subtitle={subtitle}
          value={value}
          minValue={minValue}
          maxValue={maxValue}
          type={type}
          timestamp={timestamp}
          degrees={270} // 270 grados para temperature y humidity
        />
      );

    case "pressure":
      return (
        <HorizontalBarChart
          title={title}
          subtitle={subtitle}
          value={value}
          minValue={minValue}
          maxValue={maxValue}
          type={type}
          timestamp={timestamp}
        />
      );

    case "flow":
    case "level":
      return (
        <GaugeChart
          title={title}
          subtitle={subtitle}
          value={value}
          minValue={minValue}
          maxValue={maxValue}
          type={type}
          timestamp={timestamp}
          degrees={270}
        />
      );

    case "vibration":
      return (
        <VibrationLineChart
          title={title}
          subtitle={subtitle}
          value={value}
          minValue={minValue}
          maxValue={maxValue}
          type={type}
          timestamp={timestamp}
          history={history}
        />
      );

    default:
      // Fallback al GaugeChart original para tipos no especificados
      return (
        <GaugeChart
          title={title}
          subtitle={subtitle}
          value={value}
          minValue={minValue}
          maxValue={maxValue}
          type={type}
          timestamp={timestamp}
          degrees={180}
        />
      );
  }
};

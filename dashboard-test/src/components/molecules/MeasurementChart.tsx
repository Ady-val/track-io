import type React from "react";

import type { MeasurementType } from "@/types/dashboard";

import { GaugeChart } from "./GaugeChart";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { VibrationLineChart } from "./VibrationLineChart";

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
          degrees={270} // 270 grados para temperature y humidity
          maxValue={maxValue}
          minValue={minValue}
          subtitle={subtitle}
          timestamp={timestamp}
          title={title}
          type={type}
          value={value}
        />
      );

    case "pressure":
      return (
        <HorizontalBarChart
          maxValue={maxValue}
          minValue={minValue}
          subtitle={subtitle}
          timestamp={timestamp}
          title={title}
          type={type}
          value={value}
        />
      );

    case "flow":
    case "level":
      return (
        <GaugeChart
          degrees={270}
          maxValue={maxValue}
          minValue={minValue}
          subtitle={subtitle}
          timestamp={timestamp}
          title={title}
          type={type}
          value={value}
        />
      );

    case "vibration":
      return (
        <VibrationLineChart
          history={history}
          maxValue={maxValue}
          minValue={minValue}
          subtitle={subtitle}
          timestamp={timestamp}
          title={title}
          type={type}
          value={value}
        />
      );

    default:
      // Fallback al GaugeChart original para tipos no especificados
      return (
        <GaugeChart
          degrees={180}
          maxValue={maxValue}
          minValue={minValue}
          subtitle={subtitle}
          timestamp={timestamp}
          title={title}
          type={type}
          value={value}
        />
      );
  }
};

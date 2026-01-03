import type React from "react";

import type { MeasurementType } from "@/types/dashboard";

import { GaugeChart } from "./GaugeChart";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { VibrationLineChart } from "./VibrationLineChart";
import { StatusIndicatorCard } from "./StatusIndicatorCard";

export interface MeasurementChartProps {
  title: string;
  subtitle: string;
  value: number | boolean | undefined;
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
  switch (type) {
    case "temperature":
    case "humidity":
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

    case "status":
      // Convert value to boolean for status type
      const isOn =
        typeof value === "boolean"
          ? value
          : typeof value === "number"
            ? value !== 0
            : undefined;
      return (
        <StatusIndicatorCard
          isOn={isOn}
          subtitle={subtitle}
          timestamp={timestamp}
          title={title}
          type={type}
        />
      );

    default:
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

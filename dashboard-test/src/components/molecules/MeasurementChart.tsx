import type React from "react";

import type { MeasurementType } from "@/types/dashboard";

import { GaugeChart } from "./GaugeChart";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { StatusIndicatorCard } from "./StatusIndicatorCard";
import { VibrationLineChart } from "./VibrationLineChart";

export interface MeasurementChartProps {
  title: string;
  subtitle: string;
  value: number | boolean | undefined;
  minValue: number;
  maxValue: number;
  type: MeasurementType;
  timestamp?: string;
  history?: number[];
  onStartTime?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
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
  onStartTime,
  onEdit,
  onDelete,
  showActions = false,
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
          value={typeof value === "number" ? value : undefined}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
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
          value={typeof value === "number" ? value : undefined}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
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
          value={typeof value === "number" ? value : undefined}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
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
          value={typeof value === "number" ? value : undefined}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      );

    case "status":
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
          onStartTime={onStartTime}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
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
          value={typeof value === "number" ? value : undefined}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      );
  }
};

import type React from "react";

import { Card, CardBody, Text } from "@components/atoms";

import { getMeasurementConfig } from "@/lib/measurementUtils";
import type { MeasurementType } from "@/types/dashboard";

export interface StatusIndicatorCardProps {
  title: string;
  subtitle: string;
  isOn: boolean | null | undefined;
  type: MeasurementType;
  timestamp?: string;
  className?: string;
}

export const StatusIndicatorCard: React.FC<StatusIndicatorCardProps> = ({
  title,
  subtitle,
  isOn,
  type,
  timestamp,
  className = "",
}) => {
  const config = getMeasurementConfig(type);
  const Icon = config.icon;
  const hasValue = isOn !== null && isOn !== undefined;

  const getStatusColor = () => {
    if (!hasValue) return "bg-gray-500";
    return isOn ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = () => {
    if (!hasValue) return "N/A";
    return isOn ? "ON" : "OFF";
  };

  const getStatusTextColor = () => {
    if (!hasValue) return "text-slate-400";
    return isOn ? "text-green-400" : "text-red-400";
  };

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardBody className="p-4 flex flex-col h-full">
        <div className="flex-shrink-0 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div style={{ color: config.color }}>
              <Icon className="w-5 h-5" />
            </div>
            <Text className="text-xl font-semibold text-slate-100">
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

        <div className="flex-1 flex flex-col items-center justify-center gap-4 my-4">
          <div
            className={`w-32 h-32 ${getStatusColor()} rounded-full shadow-lg flex items-center justify-center`}
          >
            <div className="w-28 h-28 bg-slate-800 rounded-full flex items-center justify-center">
              <span
                className={`text-4xl font-bold ${getStatusTextColor()}`}
              >
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 mt-auto">
          <div className="text-center">
            <Text className="text-xs text-slate-500" variant="caption">
              {hasValue && timestamp
                ? `Actualizado: ${new Date(timestamp).toLocaleTimeString()}`
                : "Esperando señal"}
            </Text>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};


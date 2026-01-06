import type React from "react";

import { Card, CardBody, Text } from "@components/atoms";

import { useStatusDuration } from "@/hooks/useStatusDuration";
import { getMeasurementConfig } from "@/lib/measurementUtils";
import type { MeasurementType } from "@/types/dashboard";

export interface StatusIndicatorCardProps {
  title: string;
  subtitle: string;
  isOn: boolean | null | undefined;
  type: MeasurementType;
  timestamp?: string;
  onStartTime?: string;
  className?: string;
}

export const StatusIndicatorCard: React.FC<StatusIndicatorCardProps> = ({
  title,
  subtitle,
  isOn,
  type,
  timestamp,
  onStartTime,
  className = "",
}) => {
  const config = getMeasurementConfig(type);
  const Icon = config.icon;
  const hasValue = isOn !== null && isOn !== undefined;
  const { duration, isActive } = useStatusDuration(onStartTime, isOn);

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
        <div className="flex-shrink-0 mb-2">
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

        <div className="flex-1 flex flex-col items-center justify-center gap-2 my-2">
          <div
            className={`w-40 h-40 ${getStatusColor()} rounded-full shadow-lg flex items-center justify-center`}
          >
            <div className="w-36 h-36 bg-slate-800 rounded-full flex items-center justify-center">
              <span className={`text-4xl font-bold ${getStatusTextColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>
          <div className="text-center min-h-[4rem] flex items-center justify-center">
            {isActive ? (
              <span className="text-[2.4rem] font-bold text-green-400 leading-none">
                {duration}
              </span>
            ) : (
              <span className="text-[2.4rem] font-bold text-transparent leading-none">
                00:00:00
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 mt-2">
          <div className="text-center">
            <Text className="text-xs text-slate-500" variant="caption">
              {hasValue && timestamp
                ? `Actualizado: ${new Date(timestamp).toLocaleDateString()} ${new Date(timestamp).toLocaleTimeString()}`
                : "Esperando señal"}
            </Text>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

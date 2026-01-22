import type React from "react";

import { Card, CardBody, Text } from "@components/atoms";
import { FaEdit, FaTrash } from "react-icons/fa";

import { useDurationTicker } from "@/hooks/useDurationTicker";
import { formatLocalDateTime } from "@/lib/dateTime";
import { useAdaptiveTitleSize } from "@/hooks/useAdaptiveTitleSize";
import { getMeasurementConfig } from "@/lib/measurementUtils";
import type { MeasurementType } from "@/types/dashboard";

export interface StatusIndicatorCardProps {
  title: string;
  subtitle: string;
  isOn: boolean | null | undefined;
  type: MeasurementType;
  timestamp?: string;
  onStartTime?: string;
  offStartTime?: string;
  statusDurationSeconds?: number;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export const StatusIndicatorCard: React.FC<StatusIndicatorCardProps> = ({
  title,
  subtitle,
  isOn,
  type,
  timestamp,
  onStartTime,
  offStartTime,
  statusDurationSeconds,
  className = "",
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const config = getMeasurementConfig(type);
  const Icon = config.icon;
  const hasValue = isOn !== null && isOn !== undefined;

  const activeDuration = useDurationTicker(
    isOn === true ? statusDurationSeconds : null,
    isOn === true
  );

  const inactiveDuration = useDurationTicker(
    isOn === false ? statusDurationSeconds : null,
    isOn === false
  );

  const isActive = isOn === true;
  const isInactive = isOn === false;

  const { titleRef, titleClassName } = useAdaptiveTitleSize({
    title,
    baseSize: "xl",
  });

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

  const formattedTimestamp = formatLocalDateTime(timestamp);

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${className} group relative`}>
      <CardBody className="p-4 flex flex-col h-full">
        {showActions && (onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {onEdit && (
              <button
                className="w-7 h-7 rounded bg-yellow-600/80 hover:bg-yellow-600 text-white flex items-center justify-center"
                aria-label="Editar"
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
                className="w-7 h-7 rounded bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center"
                aria-label="Eliminar"
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
        <div className="flex-shrink-0 mb-2">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <div style={{ color: config.color }} className="flex-shrink-0">
              <Icon className="w-5 h-5" />
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
                {activeDuration}
              </span>
            ) : isInactive ? (
              <span className="text-[2.4rem] font-bold text-red-400 leading-none">
                {inactiveDuration}
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
              {hasValue && formattedTimestamp
                ? `Actualizado: ${formattedTimestamp}`
                : "Esperando señal"}
            </Text>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

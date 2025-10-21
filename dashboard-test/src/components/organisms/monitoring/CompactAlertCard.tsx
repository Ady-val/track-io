import type React from "react";

import { Card, CardBody, Text, Chip } from "@components/atoms";

import type { AlertRule, Sensor, SensorType, SensorTypeValue } from "@/types";

export interface CompactAlertCardProps {
  rule: AlertRule;
  sensor: Sensor | undefined;
  sensorTypes: SensorType[];
  getSensorIcon: (type: SensorTypeValue) => React.ReactElement;
  onToggleEnabled: (id: string) => void;
  onClick: (rule: AlertRule) => void;
}

export const CompactAlertCard: React.FC<CompactAlertCardProps> = ({
  rule,
  sensor,
  sensorTypes,
  getSensorIcon,
  onToggleEnabled,
  onClick,
}) => {
  const getConditionText = (rule: AlertRule): string => {
    if (rule.mode === "setpoint") {
      return `${rule.operator} ${rule.setpoint}`;
    } else {
      return `[${rule.minValue}, ${rule.maxValue}]`;
    }
  };

  const handleToggleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onToggleEnabled(rule.id);
  };

  return (
    <Card
      isPressable
      className="cursor-pointer hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
      onPress={() => onClick(rule)}
    >
      <CardBody className="p-4">
        {/* Header con icono y estado */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {sensor && getSensorIcon(sensor.type)}
          </div>
          <div
            className="chip-toggle"
            onClick={handleToggleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleToggleClick(e as any);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div
              className={`cursor-pointer px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                rule.isEnabled
                  ? "bg-green-600 text-white border border-green-500"
                  : "bg-gray-600 text-white border border-gray-500"
              }`}
            >
              {rule.isEnabled ? "Activa" : "Inactiva"}
            </div>
          </div>
        </div>

        {/* Título */}
        <div className="mb-3">
          <Text className="line-clamp-2 min-h-[2.5rem]" variant="h5">
            {rule.name}
          </Text>
        </div>

        {/* Información del sensor */}
        <div className="space-y-1.5 mb-3">
          <div className="flex items-center justify-between text-xs">
            <Text color="muted" variant="caption">
              Sensor:
            </Text>
            <Text
              className="text-right truncate max-w-[60%]"
              color="secondary"
              variant="caption"
            >
              {sensor?.name ?? "Sin sensor"}
            </Text>
          </div>
          <div className="flex items-center justify-between text-xs">
            <Text color="muted" variant="caption">
              Tag:
            </Text>
            <Text
              className="font-mono text-right"
              color="secondary"
              variant="caption"
            >
              {sensor?.externalId ?? "-"}
            </Text>
          </div>
        </div>

        {/* Condición */}
        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs">
            <Text color="muted" variant="caption">
              {rule.mode === "setpoint" ? "Condición:" : "Rango:"}
            </Text>
            <Text className="font-semibold text-blue-400" variant="caption">
              {getConditionText(rule)}
            </Text>
          </div>
          {rule.mensajes && rule.mensajes.length > 0 && (
            <div className="flex items-center justify-between text-xs mt-1.5">
              <Text color="muted" variant="caption">
                Mensajes:
              </Text>
              <Chip color="primary" size="sm" variant="flat">
                {rule.mensajes.length}
              </Chip>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

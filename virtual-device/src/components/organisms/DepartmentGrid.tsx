import type { DeviceSignal, EventStatus } from "../../types";

import React from "react";

import { DepartmentCard } from "../molecules/DepartmentCard";
import { Text } from "../atoms/Text";
import { Spinner } from "../atoms/Spinner";

interface DepartmentGridProps {
  deviceSignals: DeviceSignal[];
  onSendData: (deviceSignal: DeviceSignal) => void;
  isSending: (signalId: number) => boolean;
  getError: (signalId: number) => string | undefined;
  getEventStatus: (signalId: number) => EventStatus | null;
  isLoading?: boolean;
}

export const DepartmentGrid: React.FC<DepartmentGridProps> = ({
  deviceSignals,
  onSendData,
  isSending,
  getError,
  getEventStatus,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (deviceSignals.length === 0) {
    return (
      <div className="text-center py-12">
        <Text color="muted" variant="h4">
          No hay departamentos disponibles
        </Text>
        <Text className="mt-2" color="muted" variant="body">
          Este dispositivo no tiene señales configuradas
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Text className="text-slate-100" variant="h3">
          Departamentos
        </Text>
        <Text color="muted" variant="body">
          {deviceSignals.length} departamento
          {deviceSignals.length !== 1 ? "s" : ""}
        </Text>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {deviceSignals.map((deviceSignal) => (
          <DepartmentCard
            key={deviceSignal.id}
            deviceSignal={deviceSignal}
            error={getError(deviceSignal.id)}
            eventStatus={getEventStatus(deviceSignal.id)}
            isSending={isSending(deviceSignal.id)}
            onSendData={onSendData}
          />
        ))}
      </div>
    </div>
  );
};

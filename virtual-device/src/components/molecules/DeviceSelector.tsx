import type { Device } from "../../types";

import React from "react";

import { Select } from "../atoms/Select";
import { Text } from "../atoms/Text";

interface DeviceSelectorProps {
  devices: Device[];
  selectedDeviceId: number | null;
  onDeviceChange: (deviceId: number) => void;
  hideTitle?: boolean;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  selectedDeviceId,
  onDeviceChange,
  hideTitle = false,
}) => {
  return (
    <div className={hideTitle ? "" : "space-y-2"}>
      {!hideTitle && (
        <Text className="text-slate-100" variant="h4">
          Seleccionar Dispositivo Virtual
        </Text>
      )}
      <Select
        fullWidth
        value={selectedDeviceId || ""}
        onChange={(e) => onDeviceChange(Number(e.target.value))}
      >
        <option disabled value="">
          Selecciona un dispositivo virtual
        </option>
        {devices.map((device) => (
          <option key={device.id} value={device.id}>
            {device.name ?? "Sin nombre"} - {device.areaName ?? "—"}
          </option>
        ))}
      </Select>
    </div>
  );
};

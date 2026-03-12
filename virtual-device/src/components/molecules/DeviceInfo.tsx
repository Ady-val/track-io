import type { Device } from "../../types";

import React from "react";

import { Card } from "../atoms/Card";
import { Text } from "../atoms/Text";

interface DeviceInfoProps {
  device: Device;
}

export const DeviceInfo: React.FC<DeviceInfoProps> = ({ device }) => {
  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
            <Text className="text-white" color="primary" variant="h3">
              {(device.name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </div>
          <div>
            <Text className="text-blue-900 font-semibold" variant="h3">
              {device.name ?? "Sin nombre"}
            </Text>
            <Text color="muted" variant="caption">
              ID: {device.externalId ?? "—"}
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-400">
          <div>
            <Text className="block" color="muted" variant="caption">
              Área
            </Text>
            <Text className="text-blue-900 font-medium" variant="body">
              {device.areaName ?? "—"}
            </Text>
          </div>
          <div>
            <Text className="block" color="muted" variant="caption">
              Tipo
            </Text>
            <Text className="text-blue-900 font-medium" variant="body">
              Dispositivo Virtual
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
};

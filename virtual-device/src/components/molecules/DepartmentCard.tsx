import type { DeviceSignal, EventStatus } from "../../types";

import React from "react";

import { Card } from "../atoms/Card";
import { Text } from "../atoms/Text";

interface DepartmentCardProps {
  deviceSignal: DeviceSignal;
  onSendData: (deviceSignal: DeviceSignal) => void;
  isSending?: boolean;
  error?: string;
  eventStatus?: EventStatus | null;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  deviceSignal,
  onSendData,
  isSending = false,
  error,
  eventStatus,
}) => {
  const handleClick = () => {
    onSendData(deviceSignal);
  };

  const getBackgroundColor = () => {
    if (!eventStatus) {
      return "bg-blue-600";
    }
    if (eventStatus === "open") {
      return "bg-red-600";
    }
    if (eventStatus === "in-progress") {
      return "bg-yellow-600";
    }

    return "bg-blue-600";
  };

  return (
    <div
      className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <Card>
        <div className="text-center space-y-4">
          <div
            className={`w-16 h-16 ${getBackgroundColor()} rounded-full flex items-center justify-center mx-auto`}
          >
            <Text className="text-white" color="primary" variant="h3">
              {deviceSignal.departmentName.charAt(0).toUpperCase()}
            </Text>
          </div>

          <div>
            <Text className="font-semibold" color="primary" variant="h4">
              {deviceSignal.departmentName}
            </Text>
            <Text color="muted" variant="caption">
              {deviceSignal.name}
            </Text>
          </div>

          {isSending && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          )}

          {error && <div className="text-red-600 text-sm">Error: {error}</div>}
        </div>
      </Card>
    </div>
  );
};

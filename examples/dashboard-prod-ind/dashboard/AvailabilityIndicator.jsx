import React from "react";
import { getAvailabilityColor } from "../config/departmentColors.js";

const AvailabilityIndicator = ({
  availability,
  showLabel = true,
  size = "md",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-12 h-4 text-xs";
      case "md":
        return "w-16 h-6 text-xs";
      case "lg":
        return "w-20 h-8 text-sm";
      default:
        return "w-16 h-6 text-xs";
    }
  };

  const getAvailabilityStatus = () => {
    if (availability >= 90)
      return { status: "Excelente", color: "text-green-600" };
    if (availability >= 70)
      return { status: "Buena", color: "text-yellow-600" };
    return { status: "Crítica", color: "text-red-600" };
  };

  const status = getAvailabilityStatus();

  return (
    <div className="flex items-center space-x-3">
      {showLabel && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Disponibilidad:
        </div>
      )}

      <div className="flex items-center space-x-2">
        <div className="relative">
          <div
            className={`${getSizeClasses()} rounded-full bg-gradient-to-r ${getAvailabilityColor(
              availability
            )} flex items-center justify-center shadow-md`}
          >
            <span className="font-bold text-white">{availability}%</span>
          </div>

          {/* Status indicator dot */}
          <div
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              availability >= 90
                ? "bg-green-500"
                : availability >= 70
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          ></div>
        </div>

        <div className={`text-xs font-medium ${status.color}`}>
          {status.status}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityIndicator;

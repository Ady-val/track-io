import React from "react";

import { getStatusColor } from "../../config/departmentColors";

interface StatusIndicatorProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const colorClass = getStatusColor(status);

  return (
    <div
      className={`${sizeClasses[size]} ${colorClass} rounded-full ${className}`}
      title={`Estado: ${status}`}
    />
  );
};

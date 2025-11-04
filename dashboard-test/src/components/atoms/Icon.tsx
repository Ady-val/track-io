import React from "react";

import {
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaInfo,
  FaSignal,
  FaChartLine,
  FaBuilding,
  FaUsers,
  FaWifi,
  FaPalette,
  FaBroadcastTower,
  FaEnvelope,
} from "react-icons/fa";
import { MdTraffic } from "react-icons/md";

export interface IconProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  edit: FaEdit,
  trash: FaTrash,
  "chevron-left": FaChevronLeft,
  "chevron-right": FaChevronRight,
  "alert-triangle": FaExclamationTriangle,
  "alert-circle": FaExclamationCircle,
  info: FaInfo,
  signal: FaSignal,
  activity: FaChartLine,
  building: FaBuilding,
  users: FaUsers,
  tower: MdTraffic,
  palette: FaPalette,
  radio: FaBroadcastTower,
  mail: FaEnvelope,
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = "md",
  color,
  className = "",
}) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);

    return null;
  }

  return (
    <IconComponent
      className={`${sizeClasses[size]} ${color ?? ""} ${className}`}
    />
  );
};

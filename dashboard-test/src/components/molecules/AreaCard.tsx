import type { DashboardAreaData } from "../../types/dashboard";

import React from "react";

import { FaClock } from "react-icons/fa";

export interface AreaCardProps {
  area: DashboardAreaData;
  onClick?: () => void;
  className?: string;
  getAreaEventStatus?: (areaName: string) => {
    status: "ok" | "alert" | "warning" | "critical";
    hasOpenEvents: boolean;
  };
}

export const AreaCard: React.FC<AreaCardProps> = ({
  area,
  onClick,
  className = "",
  getAreaEventStatus,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };
  const areaEventStatus = getAreaEventStatus
    ? getAreaEventStatus(area.area)
    : { status: "ok" as const, hasOpenEvents: false };

  const activeDepartments =
    area.departments?.filter(
      (dept) =>
        dept.status === "alert" ||
        dept.status === "warning" ||
        dept.status === "critical"
    ) ?? [];

  const getBorderColor = () => {
    if (areaEventStatus.status === "ok") return "border-green-500";

    if (areaEventStatus.status === "alert")
      return "border-red-500 animate-pulse";

    if (areaEventStatus.status === "warning") return "border-yellow-500";

    if (areaEventStatus.status === "critical") return "border-red-600";

    return "border-blue-500";
  };

  const getStatusColorHex = (status: string): string => {
    switch (status) {
      case "ok":
        return "#10B981";
      case "alert":
        return "#EF4444";
      case "warning":
        return "#F59E0B";
      case "critical":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const hasActiveEvents = activeDepartments.length > 0;

  return (
    <div
      aria-label={`Área ${area.area}${hasActiveEvents ? `. Tiempo acumulado: ${area.eventsTime}. ${activeDepartments.length} departamentos con eventos activos.` : "."}`}
      className={`w-72 h-fit relative cursor-pointer transition-all duration-300 hover:scale-105 bg-slate-900 rounded-xl p-6 border-2 ${getBorderColor()}
        shadow-lg hover:shadow-xl
        ${className}
      `}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col h-full text-center">
        <h3 className="text-2xl font-bold text-slate-100 mb-4">{area.area}</h3>

        {/* Solo mostrar departamentos y tiempo si hay eventos activos */}
        {hasActiveEvents && (
          <>
            {/* Indicadores de departamentos */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {activeDepartments.map((dept, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: getStatusColorHex(dept.status) + "40",
                    borderColor: getStatusColorHex(dept.status),
                    borderWidth: "1px",
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: "#FFFFFF",
                      textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                    }}
                  >
                    {dept.department}
                  </span>
                </div>
              ))}
            </div>

            {/* Tiempo de eventos - Formato horizontal */}
            <div className="flex items-center justify-center">
              <FaClock className="text-slate-400 mr-2" />
              <span className="text-slate-400 mr-1">:</span>
              <div className="min-h-[1.75rem] flex items-center text-lg font-bold text-slate-200">
                {area.eventsTime}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

import React from "react";

export interface ConnectionStatusIndicatorProps {
  status: "connected" | "disconnected" | "loading";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const ConnectionStatusIndicator: React.FC<
  ConnectionStatusIndicatorProps
> = ({ status, size = "md", showLabel = true }) => {
  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "disconnected":
        return "bg-red-500";
      case "loading":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "disconnected":
        return "Desconectado";
      case "loading":
        return "Cargando...";
      default:
        return "Desconocido";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "md":
        return "w-4 h-4";
      case "lg":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  const getPulseClass = () => {
    return status === "loading" ? "animate-pulse" : "";
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${getSizeClass()} ${getStatusColor()} ${getPulseClass()} rounded-full shadow-lg`}
      />
      {showLabel && (
        <span className="text-sm text-slate-300 font-medium">
          {getStatusLabel()}
        </span>
      )}
    </div>
  );
};

import type { DeviceSignal, EventStatus } from "../../types";

import React from "react";

interface DepartmentCardProps {
  deviceSignal: DeviceSignal;
  onSendData: (deviceSignal: DeviceSignal) => void;
  isSending?: boolean;
  error?: string;
  eventStatus?: EventStatus | null;
  elapsedSeconds?: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  deviceSignal,
  onSendData,
  isSending = false,
  error,
  eventStatus,
  elapsedSeconds = 0,
}) => {
  const handleClick = () => {
    onSendData(deviceSignal);
  };

  const letter = (deviceSignal.departmentName ?? deviceSignal.name ?? "?")
    .charAt(0)
    .toUpperCase();
  const name = deviceSignal.departmentName ?? deviceSignal.name ?? "Sin nombre";

  const getState = (): {
    bg: string;
    statusLabel: string;
    showTimer: boolean;
  } => {
    if (!eventStatus) {
      return { bg: "#24324A", statusLabel: "Todo en orden", showTimer: false };
    }
    if (eventStatus === "open") {
      return { bg: "#E53935", statusLabel: "ALERTA ACTIVA", showTimer: true };
    }
    if (eventStatus === "in-progress") {
      return { bg: "#FB8C00", statusLabel: "EN PROCESO", showTimer: true };
    }
    return { bg: "#24324A", statusLabel: "Todo en orden", showTimer: false };
  };

  const { bg, statusLabel, showTimer } = getState();

  return (
    <button
      type="button"
      className="flex flex-col items-center justify-center min-h-[120px] p-4 rounded-lg border-2 border-slate-600/50 text-left w-full cursor-pointer active:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed"
      style={{ backgroundColor: bg }}
      onClick={handleClick}
      disabled={isSending}
    >
      <div className="flex flex-col items-center w-full gap-1">
        <div className="flex items-center gap-2">
          <span
            className="w-10 h-10 rounded flex items-center justify-center bg-black/20 text-white font-bold text-lg"
            aria-hidden
          >
            {letter}
          </span>
          {showTimer && (
            <span className="text-white font-bold text-base tabular-nums">
              {formatDuration(elapsedSeconds)}
            </span>
          )}
        </div>
        <span className="text-white font-semibold text-lg leading-tight">
          {name}
        </span>
        <span className="text-white/90 text-sm font-medium uppercase tracking-wide">
          {statusLabel}
        </span>
      </div>
      {error && (
        <div className="mt-2 text-red-200 text-xs font-medium">Error: {error}</div>
      )}
      {isSending && (
        <div className="mt-2 h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
      )}
    </button>
  );
};

import React from "react";

interface StatusBarProps {
  alertCount: number;
  inProcessCount: number;
  lineStopSeconds: number;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  alertCount,
  inProcessCount,
  lineStopSeconds,
}) => {
  return (
    <div className="h-12 flex items-center gap-6 px-4 bg-slate-800/80 border-b border-slate-700">
      <div
        className={`flex items-center gap-2 px-4 py-1.5 rounded ${
          alertCount > 0 ? "bg-[#E53935] text-white" : "bg-slate-700 text-slate-300"
        }`}
      >
        <span className="text-sm font-medium">Alertas:</span>
        <span className="text-sm font-bold">{alertCount}</span>
      </div>
      <div className="w-px h-6 bg-slate-600" />
      <div
        className={`flex items-center gap-2 px-4 py-1.5 rounded ${
          inProcessCount > 0
            ? "bg-[#FB8C00] text-white"
            : "bg-slate-700 text-slate-300"
        }`}
      >
        <span className="text-sm font-medium">En proceso:</span>
        <span className="text-sm font-bold">{inProcessCount}</span>
      </div>
      <div className="w-px h-6 bg-slate-600" />
      <div className="flex items-center gap-2 px-4 py-1.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
        <span className="text-sm font-medium">Línea detenida:</span>
        <span className="text-base font-bold tabular-nums">
          {formatDuration(lineStopSeconds)}
        </span>
      </div>
    </div>
  );
};

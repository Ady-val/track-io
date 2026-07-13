import type { Device } from "../../types";

import React from "react";

export const DeviceInfoCompact: React.FC<{ device: Device }> = ({ device }) => {
  const initial = (device.name ?? "?").charAt(0).toUpperCase();

  return (
    <div className="max-h-[72px] px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-lg">
      <div className="grid grid-cols-[auto_1fr_1fr] gap-x-6 gap-y-0.5 items-center">
        <div
          className="row-span-2 w-10 h-10 rounded flex items-center justify-center bg-[#24324A] text-white font-bold text-lg flex-shrink-0"
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 text-slate-100 font-semibold text-base truncate">
          {device.name ?? "Sin nombre"}
        </div>
        <div className="min-w-0 text-slate-300 text-sm">
          <span className="text-slate-500">Área:</span> {device.areaName ?? "—"}
        </div>
        <div className="min-w-0 text-slate-400 text-sm">
          ID: {device.externalId ?? "—"}
        </div>
        <div className="min-w-0 text-slate-300 text-sm">
          <span className="text-slate-500">Tipo:</span> Dispositivo Virtual
        </div>
      </div>
    </div>
  );
};

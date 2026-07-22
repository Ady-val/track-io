import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { useAreas, type Area } from "@/hooks/useCatalogs";
import type { GroupBy } from "@/types/report";

import { Button, Select, Input, Checkbox } from "../../atoms";

export interface ReportFilterValue {
  areaId?: number;
  from: string;
  to: string;
  groupBy: GroupBy;
}

type Preset = "today" | "last7" | "thisMonth" | "custom";

function startOfDayIso(date: Date): string {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  return d.toISOString();
}

function endOfDayIso(date: Date): string {
  const d = new Date(date);

  d.setHours(23, 59, 59, 999);

  return d.toISOString();
}

function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

function computeRange(
  preset: Preset,
  customFrom: string,
  customTo: string
): { from: string; to: string } {
  const now = new Date();

  if (preset === "today") {
    return { from: startOfDayIso(now), to: endOfDayIso(now) };
  }
  if (preset === "last7") {
    const from = new Date(now);

    from.setDate(from.getDate() - 6);

    return { from: startOfDayIso(from), to: endOfDayIso(now) };
  }
  if (preset === "thisMonth") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);

    return { from: startOfDayIso(from), to: endOfDayIso(now) };
  }

  return {
    from: startOfDayIso(new Date(`${customFrom}T00:00:00`)),
    to: endOfDayIso(new Date(`${customTo}T00:00:00`)),
  };
}

export function ReportFilters({
  onChange,
  onExport,
  exporting,
  showScheduled,
  onShowScheduledChange,
  insightsSlot,
}: {
  onChange: (value: ReportFilterValue) => void;
  onExport: () => void;
  exporting: boolean;
  showScheduled: boolean;
  onShowScheduledChange: (value: boolean) => void;
  insightsSlot?: ReactNode;
}) {
  const { data: areasData } = useAreas();
  const areas: Area[] = areasData?.data ?? [];

  const today = toDateInput(new Date());
  const weekAgo = toDateInput(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));

  const [areaId, setAreaId] = useState<number | undefined>(undefined);
  const [preset, setPreset] = useState<Preset>("last7");
  const [customFrom, setCustomFrom] = useState(weekAgo);
  const [customTo, setCustomTo] = useState(today);
  const [groupBy, setGroupBy] = useState<GroupBy>("day");

  useEffect(() => {
    const { from, to } = computeRange(preset, customFrom, customTo);
    const value: ReportFilterValue = { from, to, groupBy };

    if (areaId) value.areaId = areaId;
    onChange(value);
    // onChange debe ser estable (useCallback en el padre).
  }, [areaId, preset, customFrom, customTo, groupBy, onChange]);

  const presets: Array<{ id: Preset; label: string }> = [
    { id: "today", label: "Hoy" },
    { id: "last7", label: "Últimos 7 días" },
    { id: "thisMonth", label: "Este mes" },
    { id: "custom", label: "Personalizado" },
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex flex-wrap items-end gap-4">
      <div className="min-w-[200px]">
        <label
          className="block text-xs text-slate-400 mb-1"
          htmlFor="report-area"
        >
          Área
        </label>
        <Select
          id="report-area"
          value={areaId ? String(areaId) : ""}
          onChange={(e) =>
            setAreaId(e.target.value ? Number(e.target.value) : undefined)
          }
        >
          <option value="">Todas las áreas</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </Select>
      </div>

      <Checkbox
        isSelected={showScheduled}
        size="sm"
        onValueChange={onShowScheduledChange}
      >
        <span className="text-slate-300 text-sm">Mostrar paro programado</span>
      </Checkbox>

      <div>
        <p className="text-xs text-slate-400 mb-1">Rango</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.id}
              className="text-white"
              color={preset === p.id ? "primary" : "default"}
              size="sm"
              variant={preset === p.id ? "solid" : "bordered"}
              onPress={() => setPreset(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {preset === "custom" && (
        <div className="flex items-end gap-2">
          <div>
            <label
              className="block text-xs text-slate-400 mb-1"
              htmlFor="report-from"
            >
              Desde
            </label>
            <Input
              id="report-from"
              type="date"
              value={customFrom}
              variant="bordered"
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </div>
          <div>
            <label
              className="block text-xs text-slate-400 mb-1"
              htmlFor="report-to"
            >
              Hasta
            </label>
            <Input
              id="report-to"
              type="date"
              value={customTo}
              variant="bordered"
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="min-w-[140px]">
        <label
          className="block text-xs text-slate-400 mb-1"
          htmlFor="report-groupby"
        >
          Agrupar por
        </label>
        <Select
          id="report-groupby"
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
        >
          <option value="day">Día</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
        </Select>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {insightsSlot}
        <Button
          className="text-white"
          color="success"
          isLoading={exporting}
          variant="solid"
          onPress={onExport}
        >
          Exportar a Excel
        </Button>
      </div>
    </div>
  );
}

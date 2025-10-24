import type { RawDataItem } from "../types";

import type React from "react";

import { FaRulerCombined } from "react-icons/fa6";
import { PiWaveSineBold } from "react-icons/pi";

import { Card, CardBody, Text, Chip } from "@components/atoms";
import { EmptyState } from "@components/molecules";

export interface SignalListProps {
  signals: RawDataItem[];
  selectedId?: number;
  onSelect: (signal: RawDataItem) => void;
  formatDate: (dateString: string) => string;
}

export const SignalList: React.FC<SignalListProps> = ({
  signals,
  selectedId,
  onSelect,
  formatDate,
}) => {
  if (signals.length === 0) {
    return (
      <EmptyState
        description="Los datos aparecerán aquí en tiempo real"
        icon={PiWaveSineBold}
        title="No hay registros"
      />
    );
  }

  return (
    <div className="h-full space-y-1.5 overflow-y-auto pr-1">
      {signals.map((signal) => (
        <Card
          key={signal.id}
          isHoverable
          isPressable
          className={`${
            selectedId === signal.id
              ? "bg-slate-600 border-blue-500"
              : signal.type === "signal"
                ? "bg-slate-800 border-purple-500/30"
                : "bg-slate-800 border-slate-700"
          } border transition-all`}
          onPress={() => onSelect(signal)}
        >
          <CardBody className="p-1.5">
            <div className="flex justify-between items-center gap-1.5 mb-0.5">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {signal.type === "signal" ? (
                  <PiWaveSineBold className="text-purple-400 text-xs flex-shrink-0" />
                ) : (
                  <FaRulerCombined className="text-blue-400 text-xs flex-shrink-0" />
                )}
                <Text className="truncate" color="secondary" variant="small">
                  {signal.externalId}
                </Text>
              </div>
              <Chip
                className="flex-shrink-0"
                color={signal.type === "signal" ? "secondary" : "primary"}
                size="sm"
                variant="flat"
              >
                #{signal.id}
              </Chip>
            </div>
            <Text className="truncate text-xs" color="muted">
              {signal.value}
            </Text>
            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-0.5">
              <span>{formatDate(signal.createdAt)}</span>
              {signal.type && (
                <span
                  className={`px-1 py-0.5 rounded text-[8px] font-medium ${
                    signal.type === "signal"
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {signal.type === "signal" ? "SIGNAL" : "MEASUREMENT"}
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

import type React from "react";
import { Card, CardBody, Text, Chip } from "@components/atoms";
import { EmptyState } from "@components/molecules";
import { FaSignal } from "react-icons/fa";
import type { RawDataItem } from "../types";

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
        icon={FaSignal}
        title="No hay registros"
      />
    );
  }

  return (
    <div className="space-y-1.5 overflow-auto flex-grow pr-1">
      {signals.map((signal) => (
        <Card
          key={signal.id}
          isHoverable
          isPressable
          className={`${
            selectedId === signal.id
              ? "bg-slate-600 border-blue-500"
              : "bg-slate-800 border-slate-700"
          } border transition-all`}
          onPress={() => onSelect(signal)}
        >
          <CardBody className="p-1.5">
            <div className="flex justify-between items-center gap-1.5 mb-0.5">
              <Text
                className="truncate flex-1 min-w-0"
                color="secondary"
                variant="small"
              >
                {signal.externalId}
              </Text>
              <Chip
                className="flex-shrink-0"
                color="primary"
                size="sm"
                variant="flat"
              >
                #{signal.id}
              </Chip>
            </div>
            <Text className="truncate text-xs" color="muted">
              {signal.value}
            </Text>
            <div className="text-[9px] text-slate-500 mt-0.5">
              {formatDate(signal.createdAt)}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

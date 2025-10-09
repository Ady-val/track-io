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
    <div className="space-y-2 overflow-auto flex-grow pr-2">
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
          <CardBody className="p-2">
            <div className="flex justify-between items-start mb-1">
              <Text className="truncate" color="secondary" variant="small">
                {signal.externalId}
              </Text>
              <Chip color="primary" size="sm" variant="flat">
                #{signal.id}
              </Chip>
            </div>
            <Text className="truncate" color="muted" variant="small">
              {signal.value}
            </Text>
            <div className="text-[10px] text-slate-500 mt-1">
              {formatDate(signal.createdAt)}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

import type React from "react";
import { Card, CardBody, Text, Button } from "@components/atoms";
import { StatCard, EmptyState } from "@components/molecules";
import { FaRulerCombined, FaHashtag, FaSignal, FaClock } from "react-icons/fa";
import type { RawDataItem } from "../types";

export interface SignalDetailProps {
  signal: RawDataItem | null;
  onClose: () => void;
  formatDate: (dateString: string) => string;
}

export const SignalDetail: React.FC<SignalDetailProps> = ({
  signal,
  onClose,
  formatDate,
}) => {
  if (!signal) {
    return (
      <EmptyState
        description="Los detalles aparecerán aquí"
        icon={FaRulerCombined}
        title="Selecciona un registro"
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-600 flex-shrink-0">
        <Text variant="h3">Detalles del Registro</Text>
        <Button color="default" size="sm" variant="flat" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      <div className="flex-grow overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <StatCard
            icon={FaHashtag}
            iconBgColor="bg-blue-500/20"
            iconColor="text-blue-400"
            label="ID"
            value={`#${signal.id}`}
          />

          <StatCard
            icon={FaSignal}
            iconBgColor="bg-purple-500/20"
            iconColor="text-purple-400"
            label="ID Externo"
            value={signal.externalId}
          />

          <StatCard
            icon={FaRulerCombined}
            iconBgColor="bg-green-500/20"
            iconColor="text-green-400"
            label="Valor"
            value={signal.value}
            valueClassName="font-mono"
          />

          <StatCard
            icon={FaClock}
            iconBgColor="bg-orange-500/20"
            iconColor="text-orange-400"
            label="Fecha"
            value={formatDate(signal.createdAt)}
            valueClassName="text-[11px]"
          />
        </div>

        <div className="mt-3 pt-3 border-t border-slate-600">
          <Text className="mb-2" color="secondary" variant="small">
            Datos Raw (JSON)
          </Text>
          <Card className="bg-slate-900">
            <CardBody className="p-2">
              <pre className="text-xs text-slate-300 font-mono overflow-auto max-h-40">
                {JSON.stringify(signal, null, 2)}
              </pre>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

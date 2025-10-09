import { useState, useCallback } from "react";
import { FaSignal } from "react-icons/fa";

import { Card, CardBody, Text, Button, Chip } from "@components/atoms";
import { SearchBar, ConnectionIndicator } from "@components/molecules";
import { SignalList, SignalDetail } from "@components/organisms";
import { TwoColumnLayout } from "@components/templates";
import type { RawDataItem } from "@components/organisms";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useWebSocketEvent } from "@/hooks/useWebSocketEvent";
import DefaultLayout from "@/layouts/default";

interface WebSocketMessage {
  event: string;
  data: {
    type: "signal" | "measurement";
    data: RawDataItem;
  };
  timestamp: string;
}

export default function RawSignalsPage() {
  const [signals, setSignals] = useState<RawDataItem[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<RawDataItem | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { isConnected } = useWebSocket();

  const handleNewSignal = useCallback((msg: WebSocketMessage) => {
    console.log("New signal received:", msg);

    if (msg?.data?.data) {
      setSignals((prev) => [msg.data.data, ...prev].slice(0, 100));
    }
  }, []);

  const handleNewMeasurement = useCallback((msg: WebSocketMessage) => {
    console.log("New measurement received:", msg);

    if (msg?.data?.data) {
      setSignals((prev) => [msg.data.data, ...prev].slice(0, 100));
    }
  }, []);

  useWebSocketEvent<WebSocketMessage>("new_raw_signal", handleNewSignal);
  useWebSocketEvent<WebSocketMessage>("new_raw_measurement", handleNewMeasurement);

  const filteredSignals = signals.filter(
    (signal) =>
      signal.externalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signal.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleClearSignals = () => {
    setSignals([]);
    setSelectedSignal(null);
  };

  return (
    <DefaultLayout>
      <TwoColumnLayout
        footer={
          <Card>
            <CardBody className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ConnectionIndicator
                    connectedText="Conexión WebSocket Activa"
                    disconnectedText="Desconectado"
                    isConnected={isConnected}
                  />
                  <div className="h-3 w-px bg-slate-600" />
                  <Text color="muted" variant="small">
                    new_raw_signal, new_raw_measurement
                  </Text>
                </div>
                <Button
                  color="danger"
                  size="sm"
                  variant="flat"
                  onClick={handleClearSignals}
                >
                  Limpiar
                </Button>
              </div>
            </CardBody>
          </Card>
        }
        header={
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Text className="mb-1" variant="h3">
                    Señales y Mediciones en Tiempo Real
                  </Text>
                  <Text color="muted" variant="caption">
                    Monitor de datos entrantes vía WebSocket
                  </Text>
                </div>
                <Chip color="primary" size="sm" variant="flat">
                  {signals.length} registros
                </Chip>
              </div>

              <SearchBar
                placeholder="Buscar por ID externo o valor..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </CardBody>
          </Card>
        }
        mainContent={
          <Card className="bg-slate-700 border-slate-600 h-full flex flex-col">
            <CardBody className="p-3 flex flex-col h-full overflow-hidden">
              <SignalDetail
                formatDate={formatDate}
                signal={selectedSignal}
                onClose={() => setSelectedSignal(null)}
              />
            </CardBody>
          </Card>
        }
        sidebar={
          <Card className="bg-slate-700 border-slate-600 h-full flex flex-col">
            <CardBody className="p-3 flex flex-col h-full overflow-hidden">
              <Text
                className="mb-2 flex items-center gap-2 flex-shrink-0"
                variant="caption"
              >
                <FaSignal className="text-blue-400 text-sm" />
                Lista de Registros
              </Text>
              <SignalList
                formatDate={formatDate}
                selectedId={selectedSignal?.id}
                signals={filteredSignals}
                onSelect={setSelectedSignal}
              />
            </CardBody>
          </Card>
        }
      />
    </DefaultLayout>
  );
}

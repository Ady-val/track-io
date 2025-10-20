import type { RawDataItem } from "@components/organisms";

import { useState, useCallback } from "react";

import { PiWaveSineBold } from "react-icons/pi";

import { Card, CardBody, Text, Button, Chip } from "@components/atoms";
import { SearchBar, ConnectionIndicator } from "@components/molecules";
import {
  SignalList,
  SignalDetail,
  Modal,
  CreateMeasurementForm,
} from "@components/organisms";
import { TwoColumnLayout } from "@components/templates";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { useWebSocketEvent } from "@/hooks/useWebSocketEvent";
import DefaultLayout from "@/layouts/default";
import measurementService from "@/lib/services/measurement.service";
import type { Measurement, CreateMeasurementData } from "@/types/measurement";

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
  const [selectedSignal, setSelectedSignal] = useState<RawDataItem | null>(
    null
  );
  const [selectedMeasurement, setSelectedMeasurement] =
    useState<Measurement | null>(null);
  const [isLoadingMeasurement, setIsLoadingMeasurement] =
    useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCreatingMeasurement, setIsCreatingMeasurement] =
    useState<boolean>(false);
  const { isConnected } = useWebSocket();

  const handleNewSignal = useCallback((msg: WebSocketMessage) => {
    console.log("New signal received:", msg);

    if (msg?.data?.data) {
      const signalData = { ...msg.data.data, type: "signal" as const };
      setSignals((prev) => [signalData, ...prev].slice(0, 100));
    }
  }, []);

  const handleNewMeasurement = useCallback((msg: WebSocketMessage) => {
    console.log("New measurement received:", msg);

    if (msg?.data?.data) {
      const measurementData = {
        ...msg.data.data,
        type: "measurement" as const,
      };
      setSignals((prev) => [measurementData, ...prev].slice(0, 100));
    }
  }, []);

  useWebSocketEvent<WebSocketMessage>("new_raw_signal", handleNewSignal);
  useWebSocketEvent<WebSocketMessage>(
    "new_raw_measurement",
    handleNewMeasurement
  );

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
    setSelectedMeasurement(null);
  };

  const handleSelectSignal = useCallback(async (signal: RawDataItem) => {
    setSelectedSignal(signal);
    setSelectedMeasurement(null);

    // Solo buscar measurement si el tipo es 'measurement'
    if (signal.type === "measurement") {
      setIsLoadingMeasurement(true);

      try {
        const measurement = await measurementService.getByExternalId(
          signal.externalId
        );
        setSelectedMeasurement(measurement);
      } catch (error) {
        console.error("Error fetching measurement:", error);
        setSelectedMeasurement(null);
      } finally {
        setIsLoadingMeasurement(false);
      }
    } else {
      setIsLoadingMeasurement(false);
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedSignal(null);
    setSelectedMeasurement(null);
    setIsModalOpen(false);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleCreateMeasurement = useCallback(
    async (data: CreateMeasurementData) => {
      if (!selectedSignal || selectedSignal.type !== "measurement") return;

      setIsCreatingMeasurement(true);

      try {
        const newMeasurement = await measurementService.create(data);

        setSelectedMeasurement(newMeasurement);
        setIsModalOpen(false);

        // Optional: Show success message
        console.log("Measurement created successfully:", newMeasurement);
      } catch (error) {
        console.error("Error creating measurement:", error);
        // Optional: Show error message to user
      } finally {
        setIsCreatingMeasurement(false);
      }
    },
    [selectedSignal]
  );

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
                    Monitor de datos entrantes vía WebSocket - Distingue entre
                    signals y measurements
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
                isLoadingMeasurement={isLoadingMeasurement}
                measurement={selectedMeasurement}
                signal={selectedSignal}
                onClose={handleCloseDetail}
                onCreateMeasurement={handleOpenCreateModal}
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
                <PiWaveSineBold className="text-blue-400 text-sm" />
                Lista de Registros
              </Text>
              <SignalList
                formatDate={formatDate}
                selectedId={selectedSignal?.id}
                signals={filteredSignals}
                onSelect={handleSelectSignal}
              />
            </CardBody>
          </Card>
        }
      />

      {/* Modal para crear Measurement */}
      <Modal
        isOpen={isModalOpen}
        size="md"
        title="Crear Nuevo Dispositivo de Medición"
        onClose={handleCloseCreateModal}
      >
        {selectedSignal && (
          <CreateMeasurementForm
            externalId={selectedSignal.externalId}
            isLoading={isCreatingMeasurement}
            onCancel={handleCloseCreateModal}
            onSubmit={handleCreateMeasurement}
          />
        )}
      </Modal>
    </DefaultLayout>
  );
}

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
  CreateDeviceForm,
  CreateDeviceSignalForm,
  CreateDeviceAndSignalForm,
  CreateDeviceSignalWithDeviceForm,
} from "@components/organisms";
import { TwoColumnLayout } from "@components/templates";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { useWebSocketEvent } from "@/hooks/useWebSocketEvent";
import deviceSignalService from "@/lib/services/device-signal.service";
import deviceService from "@/lib/services/device.service";
import measurementService from "@/lib/services/measurement.service";
import type { Device, CreateDeviceData } from "@/types/device";
import type {
  DeviceSignal,
  CreateDeviceSignalData,
} from "@/types/device-signal";
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
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedDeviceSignal, setSelectedDeviceSignal] =
    useState<DeviceSignal | null>(null);
  const [isLoadingMeasurement, setIsLoadingMeasurement] =
    useState<boolean>(false);
  const [isLoadingDevice, setIsLoadingDevice] = useState<boolean>(false);
  const [isLoadingDeviceSignal, setIsLoadingDeviceSignal] =
    useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<
    | "measurement"
    | "device"
    | "deviceSignal"
    | "deviceAndSignal"
    | "deviceSignalWithDevice"
  >("measurement");
  const [usedDepartments, setUsedDepartments] = useState<number[]>([]);
  const [isCreatingMeasurement, setIsCreatingMeasurement] =
    useState<boolean>(false);
  const [isCreatingDevice, setIsCreatingDevice] = useState<boolean>(false);
  const [isCreatingDeviceSignal, setIsCreatingDeviceSignal] =
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
    setSelectedDevice(null);
    setSelectedDeviceSignal(null);
  };

  const handleSelectSignal = useCallback(async (signal: RawDataItem) => {
    setSelectedSignal(signal);
    setSelectedMeasurement(null);
    setSelectedDevice(null);
    setSelectedDeviceSignal(null);

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
    } else if (signal.type === "signal") {
      setIsLoadingDevice(true);
      try {
        const device = await deviceService.getByExternalId(signal.externalId);

        setSelectedDevice(device);

        if (device) {
          setIsLoadingDeviceSignal(true);
          try {
            const deviceSignal =
              await deviceSignalService.getByExternalValueIdAndDeviceExternalId(
                signal.value,
                signal.externalId
              );

            setSelectedDeviceSignal(deviceSignal);

            const existingSignals = await deviceSignalService.getByDeviceId(
              device.id
            );
            const usedDepts = existingSignals.map(
              (signal) => signal.departmentId
            );

            setUsedDepartments(usedDepts);
          } catch (error) {
            console.error("Error fetching device signal:", error);
            setSelectedDeviceSignal(null);
            setUsedDepartments([]);
          } finally {
            setIsLoadingDeviceSignal(false);
          }
        }
      } catch (error) {
        console.error("Error fetching device:", error);
        setSelectedDevice(null);
      } finally {
        setIsLoadingDevice(false);
      }
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedSignal(null);
    setSelectedMeasurement(null);
    setSelectedDevice(null);
    setSelectedDeviceSignal(null);
    setIsModalOpen(false);
  }, []);

  const handleOpenCreateModal = useCallback(
    (
      type:
        | "measurement"
        | "device"
        | "deviceSignal"
        | "deviceAndSignal"
        | "deviceSignalWithDevice"
    ) => {
      setModalType(type);
      setIsModalOpen(true);
    },
    []
  );

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

        console.log("Measurement created successfully:", newMeasurement);
      } catch (error) {
        console.error("Error creating measurement:", error);
      } finally {
        setIsCreatingMeasurement(false);
      }
    },
    [selectedSignal]
  );

  const handleCreateDevice = useCallback(
    async (data: CreateDeviceData) => {
      if (!selectedSignal || selectedSignal.type !== "signal") return;

      setIsCreatingDevice(true);

      try {
        const newDevice = await deviceService.create(data);

        setSelectedDevice(newDevice);
        setIsModalOpen(false);

        console.log("Device created successfully:", newDevice);
      } catch (error) {
        console.error("Error creating device:", error);
      } finally {
        setIsCreatingDevice(false);
      }
    },
    [selectedSignal]
  );

  const handleCreateDeviceSignal = useCallback(
    async (data: CreateDeviceSignalData) => {
      if (
        !selectedSignal ||
        selectedSignal.type !== "signal" ||
        !selectedDevice
      )
        return;

      setIsCreatingDeviceSignal(true);

      try {
        const newDeviceSignal = await deviceSignalService.create(data);

        setSelectedDeviceSignal(newDeviceSignal);
        setIsModalOpen(false);

        setUsedDepartments((prev) => [...prev, data.departmentId]);

        console.log("Device signal created successfully:", newDeviceSignal);
      } catch (error) {
        console.error("Error creating device signal:", error);
      } finally {
        setIsCreatingDeviceSignal(false);
      }
    },
    [selectedSignal, selectedDevice]
  );

  const handleCreateDeviceAndSignal = useCallback(
    async (
      deviceData: CreateDeviceData,
      signalData: Omit<CreateDeviceSignalData, "deviceId">
    ) => {
      if (!selectedSignal || selectedSignal.type !== "signal") return;

      setIsCreatingDevice(true);

      try {
        const newDevice = await deviceService.create(deviceData);

        setSelectedDevice(newDevice);

        const signalDataWithDevice: CreateDeviceSignalData = {
          ...signalData,
          deviceId: newDevice.id,
        };

        const newDeviceSignal =
          await deviceSignalService.create(signalDataWithDevice);

        setSelectedDeviceSignal(newDeviceSignal);

        setUsedDepartments([signalData.departmentId]);

        setIsModalOpen(false);

        console.log("Device and signal created successfully:", {
          newDevice,
          newDeviceSignal,
        });
      } catch (error) {
        console.error("Error creating device and signal:", error);
      } finally {
        setIsCreatingDevice(false);
      }
    },
    [selectedSignal]
  );

  return (
    <>
      <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100% + 48px)', margin: '-24px', padding: '24px' }}>
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
            <Card className="bg-slate-700 border-slate-600 flex flex-col h-full">
              <CardBody className="p-3 flex flex-col h-full overflow-hidden">
                <SignalDetail
                  device={selectedDevice}
                  deviceSignal={selectedDeviceSignal}
                  formatDate={formatDate}
                  isLoadingDevice={isLoadingDevice}
                  isLoadingDeviceSignal={isLoadingDeviceSignal}
                  isLoadingMeasurement={isLoadingMeasurement}
                  measurement={selectedMeasurement}
                  signal={selectedSignal}
                  onClose={handleCloseDetail}
                  onCreateDevice={() => {
                    if (!selectedDevice && !selectedDeviceSignal) {
                      handleOpenCreateModal("deviceAndSignal");
                    } else {
                      handleOpenCreateModal("device");
                    }
                  }}
                  onCreateDeviceSignal={() => {
                    if (selectedDevice && !selectedDeviceSignal) {
                      handleOpenCreateModal("deviceSignalWithDevice");
                    } else {
                      handleOpenCreateModal("deviceSignal");
                    }
                  }}
                  onCreateMeasurement={() => handleOpenCreateModal("measurement")}
                />
              </CardBody>
            </Card>
          }
          sidebar={
            <Card className="bg-slate-700 border-slate-600 flex flex-col h-full">
              <CardBody className="p-3 flex flex-col h-full overflow-hidden">
                <Text
                  className="mb-2 flex items-center gap-2 flex-shrink-0"
                  variant="caption"
                >
                  <PiWaveSineBold className="text-blue-400 text-sm" />
                  Lista de Registros
                </Text>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <SignalList
                    formatDate={formatDate}
                    selectedId={selectedSignal?.id}
                    signals={filteredSignals}
                    onSelect={handleSelectSignal}
                  />
                </div>
              </CardBody>
            </Card>
          }
        />
      </div>
      <Modal
        isOpen={isModalOpen}
        size="md"
        title={
          modalType === "measurement"
            ? "Crear Nuevo Dispositivo de Medición"
            : modalType === "device"
              ? "Crear Nuevo Dispositivo"
              : modalType === "deviceSignal"
                ? "Crear Nueva Señal del Dispositivo"
                : modalType === "deviceAndSignal"
                  ? "Crear Dispositivo y Señal"
                  : "Crear Señal para Dispositivo Existente"
        }
        onClose={handleCloseCreateModal}
      >
        {selectedSignal && modalType === "measurement" && (
          <CreateMeasurementForm
            externalId={selectedSignal.externalId}
            isLoading={isCreatingMeasurement}
            onCancel={handleCloseCreateModal}
            onSubmit={handleCreateMeasurement}
          />
        )}
        {selectedSignal && modalType === "device" && (
          <CreateDeviceForm
            externalId={selectedSignal.externalId}
            isLoading={isCreatingDevice}
            onCancel={handleCloseCreateModal}
            onSubmit={handleCreateDevice}
          />
        )}
        {selectedSignal && selectedDevice && modalType === "deviceSignal" && (
          <CreateDeviceSignalForm
            deviceId={selectedDevice.id}
            deviceName={selectedDevice.name}
            externalValueId={selectedSignal.value}
            isLoading={isCreatingDeviceSignal}
            onCancel={handleCloseCreateModal}
            onSubmit={handleCreateDeviceSignal}
          />
        )}
        {selectedSignal && modalType === "deviceAndSignal" && (
          <CreateDeviceAndSignalForm
            externalId={selectedSignal.externalId}
            externalValueId={selectedSignal.value}
            isLoading={isCreatingDevice}
            onCancel={handleCloseCreateModal}
            onSubmit={handleCreateDeviceAndSignal}
          />
        )}
        {selectedSignal &&
          selectedDevice &&
          modalType === "deviceSignalWithDevice" && (
            <CreateDeviceSignalWithDeviceForm
              device={selectedDevice}
              externalValueId={selectedSignal.value}
              isLoading={isCreatingDeviceSignal}
              usedDepartments={usedDepartments}
              onCancel={handleCloseCreateModal}
              onSubmit={handleCreateDeviceSignal}
            />
          )}
      </Modal>
    </>
  );
}

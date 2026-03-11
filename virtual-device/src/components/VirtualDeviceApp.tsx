import type { DeviceSignal } from "../types";

import React, { useState, useEffect } from "react";

import { useVirtualDevices } from "../hooks/useVirtualDevices";
import { useSignalSender } from "../hooks/useSignalSender";
import { apiService, type EventItem } from "../services/api";

import { DeviceSelector } from "./molecules/DeviceSelector";
import { DeviceInfo } from "./molecules/DeviceInfo";
import { DepartmentGrid } from "./organisms/DepartmentGrid";
import { SignalModal } from "./organisms/SignalModal";
import { Text } from "./atoms/Text";
import { Spinner } from "./atoms/Spinner";

export const VirtualDeviceApp: React.FC = () => {
  const { devices, isLoading, error } = useVirtualDevices();
  const { sendVirtualDeviceSignal, isSending, getError } = useSignalSender();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<DeviceSignal | null>(
    null,
  );
  const [events, setEvents] = useState<Map<number, EventItem>>(new Map());

  const selectedDevice = devices.find(
    (device) => device.id === selectedDeviceId,
  );

  const fetchEvents = async () => {
    if (!selectedDevice) {
      setEvents(new Map());

      return;
    }

    const newEvents = new Map();

    for (const signal of selectedDevice.deviceSignals || []) {
      try {
        const activeEvent = await apiService.getActiveEvent(
          selectedDevice.id,
          signal.id,
        );

        if (activeEvent) {
          newEvents.set(signal.id, activeEvent);
        }
      } catch {}
    }

    setEvents(newEvents);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDevice]);

  const handleSendData = (deviceSignal: DeviceSignal) => {
    setSelectedSignal(deviceSignal);
    setShowModal(true);
  };

  const handleModalConfirm = async (reason: string, comment: string) => {
    if (!selectedDevice || !selectedSignal) {
      return;
    }

    try {
      const requireReason = !events.has(selectedSignal.id);

      if (requireReason && !reason) {
        return;
      }

      await sendVirtualDeviceSignal(
        selectedDevice,
        selectedSignal,
        reason || "",
        comment,
      );

      setShowModal(false);
      setSelectedSignal(null);

      setTimeout(() => {
        fetchEvents();
      }, 1500);
    } catch {}
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSignal(null);
  };

  const getEventStatus = (signalId: number) => {
    return events.get(signalId)?.status || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <Text className="mt-4" color="muted" variant="h4">
            Cargando aplicación...
          </Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Text className="mb-2" color="danger" variant="h4">
            Error al cargar la aplicación
          </Text>
          <Text color="muted" variant="body">
            {error}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1">
            <Text className="text-slate-100 font-bold" variant="h1">
              Virtual Device Simulator
            </Text>
            <Text className="mt-2" color="muted" variant="body">
              Simula el envío de datos desde dispositivos virtuales
            </Text>
          </div>
          <div className="flex-shrink-0 w-64">
            <DeviceSelector
              hideTitle
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onDeviceChange={setSelectedDeviceId}
            />
          </div>
        </div>

        {selectedDevice && (
          <div className="mb-8">
            <DeviceInfo device={selectedDevice} />
          </div>
        )}

        {selectedDevice && (
          <DepartmentGrid
            deviceSignals={selectedDevice.deviceSignals || []}
            getError={getError}
            getEventStatus={getEventStatus}
            isSending={isSending}
            onSendData={handleSendData}
          />
        )}

        <SignalModal
          deviceSignal={selectedSignal}
          isLoading={isSending(selectedSignal?.id || 0)}
          isOpen={showModal}
          requireReason={!selectedSignal || !events.has(selectedSignal.id)}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
        />

        {!selectedDevice && !isLoading && (
          <div className="text-center py-12">
            <Text color="muted" variant="h4">
              Selecciona un dispositivo virtual para comenzar
            </Text>
            <Text className="mt-2" color="muted" variant="body">
              Elige un dispositivo de la lista para ver sus departamentos
              disponibles
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

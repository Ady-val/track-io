import type { DeviceSignal } from "../types";

import React, { useState, useEffect, useCallback, useRef } from "react";

import { useVirtualDevices } from "../hooks/useVirtualDevices";
import { useSignalSender } from "../hooks/useSignalSender";
import { apiService, type EventItem } from "../services/api";

import { DeviceSelector } from "./molecules/DeviceSelector";
import { DeviceInfoCompact } from "./molecules/DeviceInfoCompact";
import { DepartmentGrid } from "./organisms/DepartmentGrid";
import { StatusBar } from "./organisms/StatusBar";
import { SignalModal } from "./organisms/SignalModal";
import { Text } from "./atoms/Text";
import { Spinner } from "./atoms/Spinner";

const SELECTED_DEVICE_KEY = "virtual-device-selected-id";

export const VirtualDeviceApp: React.FC = () => {
  const { devices, isLoading, error } = useVirtualDevices();
  const { sendVirtualDeviceSignal, isSending, getError } = useSignalSender();
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<DeviceSignal | null>(
    null,
  );
  const [events, setEvents] = useState<Map<number, EventItem>>(new Map());
  const [lineOutageStartAt, setLineOutageStartAt] = useState<string | null>(
    null,
  );
  const [tick, setTick] = useState(0);
  const lineOutageStartTimeRef = useRef<number | null>(null);

  const selectedDevice = devices.find(
    (device) => device.id === selectedDeviceId,
  );

  const fetchEvents = useCallback(async () => {
    if (!selectedDevice) {
      setEvents(new Map());
      setLineOutageStartAt(null);
      return;
    }

    const newEvents = new Map<number, EventItem>();

    for (const signal of selectedDevice.deviceSignals || []) {
      try {
        const activeEvent = await apiService.getActiveEvent(
          selectedDevice.id,
          signal.id,
        );

        if (activeEvent) {
          newEvents.set(signal.id, activeEvent);
        }
      } catch {
        // ignore
      }
    }

    setEvents(newEvents);

    try {
      const { data } = await apiService.getLineStopForArea(
        selectedDevice.areaId,
      );
      setLineOutageStartAt(data.startAt);
    } catch {
      setLineOutageStartAt(null);
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (!isLoading && devices.length > 0 && selectedDeviceId === null) {
      const stored = sessionStorage.getItem(SELECTED_DEVICE_KEY);
      if (stored) {
        const id = Number(stored);
        if (devices.some((d) => d.id === id)) {
          setSelectedDeviceId(id);
        }
      }
    }
  }, [isLoading, devices, selectedDeviceId]);

  const handleDeviceChange = useCallback((deviceId: number) => {
    setSelectedDeviceId(deviceId);
    sessionStorage.setItem(SELECTED_DEVICE_KEY, String(deviceId));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    lineOutageStartTimeRef.current = null;
  }, [selectedDeviceId]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedSeconds = useCallback(
    (signalId: number): number => {
      const event = events.get(signalId);
      if (!event?.createdAt) return 0;
      return Math.max(
        0,
        Math.floor((Date.now() - new Date(event.createdAt).getTime()) / 1000),
      );
    },
    // tick is the dependency that triggers re-evaluation every second
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, tick],
  );

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
    } catch {
      // ignore
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSignal(null);
  };

  const getEventStatus = (signalId: number) => {
    return events.get(signalId)?.status ?? null;
  };

  const allEventValues = Array.from(events.values());
  const alertCount = allEventValues.filter((e) => e.status === "open").length;
  const inProcessCount = allEventValues.filter(
    (e) => e.status === "in-progress",
  ).length;

  // Usar startAt del backend (AreaDowntime) para sobrevivir al refresh.
  // Fallback al evento más antiguo si el API no devuelve downtime.
  const lineStopSeconds = (() => {
    const activeEvents = allEventValues.filter(
      (e) =>
        (e.status === "open" || e.status === "in-progress") && e.createdAt,
    );
    if (activeEvents.length === 0) {
      lineOutageStartTimeRef.current = null;
      return 0;
    }
    let startTime: number | null = null;
    if (lineOutageStartAt) {
      startTime = new Date(lineOutageStartAt).getTime();
    }
    if (!startTime) {
      startTime = lineOutageStartTimeRef.current;
    }
    if (!startTime) {
      const oldest = activeEvents.reduce((prev, cur) =>
        new Date(cur.createdAt!).getTime() <
        new Date(prev.createdAt!).getTime()
          ? cur
          : prev,
      );
      startTime = new Date(oldest.createdAt!).getTime();
      lineOutageStartTimeRef.current = startTime;
    }
    return Math.max(0, Math.floor((Date.now() - startTime) / 1000));
  })();

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
    <div
      className="min-h-screen bg-slate-900 flex flex-col items-center"
      data-tick={tick}
    >
      <div className="w-full max-w-5xl flex flex-col min-h-screen">
        <header className="h-16 max-h-16 flex items-center justify-between px-4 border-b border-slate-700 flex-shrink-0">
          <h1 className="text-slate-100 font-bold text-2xl truncate">
            Virtual Device Simulator
          </h1>
          <div className="flex-shrink-0 w-56 ml-4">
            <DeviceSelector
              hideTitle
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onDeviceChange={handleDeviceChange}
            />
          </div>
        </header>

        {selectedDevice && (
          <StatusBar
            alertCount={alertCount}
            inProcessCount={inProcessCount}
            lineStopSeconds={lineStopSeconds}
          />
        )}

        <main className="flex-1 overflow-auto px-4 py-4">
          {selectedDevice && (
            <div className="mb-4">
              <DeviceInfoCompact device={selectedDevice} />
            </div>
          )}

          {selectedDevice && (
            <DepartmentGrid
              deviceSignals={selectedDevice.deviceSignals || []}
              getElapsedSeconds={getElapsedSeconds}
              getError={getError}
              getEventStatus={getEventStatus}
              isSending={isSending}
              onSendData={handleSendData}
            />
          )}

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
        </main>
      </div>

      <SignalModal
        deviceSignal={selectedSignal}
        isLoading={isSending(selectedSignal?.id || 0)}
        isOpen={showModal}
        requireReason={!selectedSignal || !events.has(selectedSignal.id)}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};

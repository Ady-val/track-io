import { useState, useEffect, useCallback } from "react";

import { useWebSocket } from "@/contexts/WebSocketContext";

interface MeasurementValue {
  value: number;
  timestamp: string;
}

type MeasurementValues = Record<number, MeasurementValue>;

interface WebSocketMessage {
  data?: {
    data?: {
      measurementId?: number;
      value?: string | number;
      createdAt?: string;
    };
    measurementId?: number;
    value?: string | number;
    createdAt?: string;
  };
  measurementId?: number;
  value?: string | number;
  createdAt?: string;
}

export const useRealtimeMeasurementValues = () => {
  const { socket } = useWebSocket();
  const [values, setValues] = useState<MeasurementValues>({});
  const [history, setHistory] = useState<Record<number, number[]>>({});

  const handleMeasurementValue = useCallback((message: WebSocketMessage) => {
    const payload = message.data?.data ?? message.data;

    if (!payload?.measurementId) {
      return;
    }

    const { measurementId, value, createdAt } = payload;

    if (!value || !createdAt) {
      return;
    }

    const newValue = parseFloat(String(value));

    setValues((prev) => ({
      ...prev,
      [measurementId]: {
        value: newValue,
        timestamp: createdAt,
      },
    }));

    setHistory((prev) => {
      const currentHistory = prev[measurementId] ?? [];
      const newHistory = [...currentHistory, newValue].slice(-20);

      return {
        ...prev,
        [measurementId]: newHistory,
      };
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("new_measurement_value", handleMeasurementValue);

    return () => {
      socket.off("new_measurement_value", handleMeasurementValue);
    };
  }, [socket, handleMeasurementValue]);

  return {
    values,
    history,
    getValue: (measurementId: number) => values[measurementId]?.value,
    getTimestamp: (measurementId: number) => values[measurementId]?.timestamp,
    getHistory: (measurementId: number) => history[measurementId] ?? [],
  };
};

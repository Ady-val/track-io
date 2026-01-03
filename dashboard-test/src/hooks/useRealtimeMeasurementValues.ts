import { useState, useEffect, useCallback } from "react";

import { useWebSocket } from "@/contexts/WebSocketContext";

function parseBooleanValue(value: string | number): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  
  const str = String(value).toLowerCase().trim();
  if (str === 'true' || str === '1' || str === 'on') return true;
  if (str === 'false' || str === '0' || str === 'off') return false;
  
  return null; // Valor inválido
}

interface MeasurementValue {
  value: number | boolean;
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

    if (value === undefined || value === null || !createdAt) {
      return;
    }

    // Try to parse as boolean first
    const booleanValue = parseBooleanValue(value);
    
    let newValue: number | boolean;
    if (booleanValue !== null) {
      // It's a boolean value
      newValue = booleanValue;
    } else {
      // Try to parse as number
      const numValue = parseFloat(String(value));
      if (isNaN(numValue)) {
        // Invalid value, skip
        return;
      }
      newValue = numValue;
    }

    setValues((prev) => ({
      ...prev,
      [measurementId]: {
        value: newValue,
        timestamp: createdAt,
      },
    }));

    // Only add to history if it's a number
    if (typeof newValue === 'number') {
      setHistory((prev) => {
        const currentHistory = prev[measurementId] ?? [];
        const newHistory = [...currentHistory, newValue as number].slice(-20);

        return {
          ...prev,
          [measurementId]: newHistory,
        };
      });
    }
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

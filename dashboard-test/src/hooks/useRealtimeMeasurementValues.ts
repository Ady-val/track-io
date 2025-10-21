import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/contexts/WebSocketContext";
import type {
  MeasurementValueState,
  MeasurementValueEvent,
} from "@/types/dashboard";

export const useRealtimeMeasurementValues = () => {
  const { socket } = useWebSocket();
  const [values, setValues] = useState<MeasurementValueState>({});
  const [history, setHistory] = useState<Record<number, number[]>>({});

  const handleMeasurementValue = useCallback((message: any) => {
    console.log("📊 [WebSocket] Received new_measurement_value:", message);

    const payload = message.data?.data || message.data;

    if (!payload || !payload.measurementId) {
      console.error("⚠️ Invalid message format:", message);
      return;
    }

    const { measurementId, value, createdAt } = payload;

    console.log(
      `📊 Updating measurementId ${measurementId} with value ${value}`
    );

    const newValue = parseFloat(value);

    setValues((prev) => ({
      ...prev,
      [measurementId]: {
        value: newValue,
        timestamp: createdAt,
      },
    }));

    setHistory((prev) => {
      const currentHistory = prev[measurementId] || [];
      const newHistory = [...currentHistory, newValue].slice(-20); // Mantener solo los últimos 20
      return {
        ...prev,
        [measurementId]: newHistory,
      };
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      console.log("⚠️ Socket not available yet");
      return;
    }

    console.log("✅ Subscribing to new_measurement_value event");

    const debugListener = (...args: any[]) => {
      console.log("🔔 [DEBUG] Received event:", args);
    };
    socket.onAny(debugListener);

    socket.on("new_measurement_value", handleMeasurementValue);

    return () => {
      console.log("🔌 Unsubscribing from new_measurement_value event");
      socket.offAny(debugListener);
      socket.off("new_measurement_value", handleMeasurementValue);
    };
  }, [socket, handleMeasurementValue]);

  useEffect(() => {
    console.log("📊 Current measurement values state:", values);
  }, [values]);

  return {
    values,
    history,
    getValue: (measurementId: number) => values[measurementId]?.value,
    getTimestamp: (measurementId: number) => values[measurementId]?.timestamp,
    getHistory: (measurementId: number) => history[measurementId] || [],
  };
};

import { useState, useEffect, useCallback } from "react";

import { useWebSocket } from "@/contexts/WebSocketContext";

function parseBooleanValue(value: string | number): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  const str = String(value).toLowerCase().trim();

  if (str === "true" || str === "1" || str === "on") return true;
  if (str === "false" || str === "0" || str === "off") return false;

  return null;
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
  const [onStartTimes, setOnStartTimes] = useState<Record<number, string>>({});

  const initializeValue = useCallback(
    (
      measurementId: number,
      value: string,
      createdAt: string,
      onStartTime?: string
    ) => {
      const booleanValue = parseBooleanValue(value);

      let parsedValue: number | boolean;

      if (booleanValue !== null) {
        parsedValue = booleanValue;
      } else {
        const numValue = parseFloat(String(value));

        if (isNaN(numValue)) {
          return;
        }
        parsedValue = numValue;
      }

      setValues((prev) => {
        if (prev[measurementId]) {
          return prev;
        }

        return {
          ...prev,
          [measurementId]: {
            value: parsedValue,
            timestamp: createdAt,
          },
        };
      });

      if (onStartTime && booleanValue === true) {
        setOnStartTimes((prev) => {
          if (prev[measurementId]) {
            return prev;
          }

          return {
            ...prev,
            [measurementId]: onStartTime,
          };
        });
      }

      if (typeof parsedValue === "number") {
        setHistory((prev) => {
          if (prev[measurementId]) {
            return prev;
          }

          return {
            ...prev,
            [measurementId]: [parsedValue],
          };
        });
      }
    },
    []
  );

  const handleMeasurementValue = useCallback((message: WebSocketMessage) => {
    const payload = message.data?.data ?? message.data;

    if (!payload?.measurementId) {
      return;
    }

    const { measurementId, value, createdAt } = payload;

    if (value === undefined || value === null || !createdAt) {
      return;
    }

    const booleanValue = parseBooleanValue(value);

    let newValue: number | boolean;

    if (booleanValue !== null) {
      newValue = booleanValue;
    } else {
      const numValue = parseFloat(String(value));

      if (isNaN(numValue)) {
        return;
      }
      newValue = numValue;
    }

    if (booleanValue !== null) {
      setValues((prev) => {
        const previousValue = prev[measurementId]?.value;
        const previousBoolean =
          typeof previousValue === "boolean" ? previousValue : null;

        setOnStartTimes((prevTimes) => {
          const hasOnStartTime = prevTimes[measurementId] !== undefined;

          if (booleanValue === true) {
            if (previousBoolean === false) {
              return {
                ...prevTimes,
                [measurementId]: createdAt,
              };
            }
            if (previousBoolean === null && !hasOnStartTime) {
              return {
                ...prevTimes,
                [measurementId]: createdAt,
              };
            }

            return prevTimes;
          } else if (booleanValue === false && previousBoolean === true) {
            const newTimes = { ...prevTimes };

            delete newTimes[measurementId];

            return newTimes;
          }

          return prevTimes;
        });

        return {
          ...prev,
          [measurementId]: {
            value: newValue,
            timestamp: createdAt,
          },
        };
      });
    } else {
      setValues((prev) => ({
        ...prev,
        [measurementId]: {
          value: newValue,
          timestamp: createdAt,
        },
      }));
    }

    if (typeof newValue === "number") {
      setHistory((prev) => {
        const currentHistory = prev[measurementId] ?? [];
        const newHistory = [...currentHistory, newValue].slice(-25);

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
    getOnStartTime: (measurementId: number) => onStartTimes[measurementId],
    initializeValue,
  };
};

import { useState, useEffect, useCallback } from "react";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { updateServerTimeOffset } from "@/lib/timeSync";
import { normalizeTimestampString } from "@/lib/dateTime";

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
  const [offStartTimes, setOffStartTimes] = useState<Record<number, string>>({});
  const [statusDurations, setStatusDurations] = useState<Record<number, number>>({});

  const initializeValue = useCallback(
    (
      measurementId: number,
      value: string,
      createdAt: string,
      onStartTime?: string,
      offStartTime?: string,
      statusDurationSeconds?: number
    ) => {
      const normalizedCreatedAt =
        normalizeTimestampString(createdAt) ?? createdAt;
      const normalizedOnStartTime = normalizeTimestampString(onStartTime);
      const normalizedOffStartTime = normalizeTimestampString(offStartTime);

      updateServerTimeOffset(normalizedCreatedAt);

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
        // Always update value from backend initialization
        return {
          ...prev,
          [measurementId]: {
            value: parsedValue,
            timestamp: normalizedCreatedAt,
          },
        };
      });

      // Initialize onStartTime if provided from backend (always prioritize backend)
      if (onStartTime !== undefined) {
        setOnStartTimes((prev) => ({
          ...prev,
          [measurementId]: normalizedOnStartTime ?? onStartTime,
        }));
      }

      // Initialize offStartTime if provided from backend (always prioritize backend)
      if (offStartTime !== undefined) {
        setOffStartTimes((prev) => ({
          ...prev,
          [measurementId]: normalizedOffStartTime ?? offStartTime,
        }));
      } else if (booleanValue === false) {
        // If no offStartTime from backend but value is false, use createdAt only if not set
        setOffStartTimes((prev) => {
          if (prev[measurementId]) {
            return prev;
          }

          return {
            ...prev,
            [measurementId]: normalizedCreatedAt,
          };
        });
      }

      if (statusDurationSeconds !== undefined) {
        setStatusDurations((prev) => ({
          ...prev,
          [measurementId]: statusDurationSeconds,
        }));
      } else if (booleanValue !== null) {
        setStatusDurations((prev) => {
          if (prev[measurementId] !== undefined) {
            return prev;
          }

          return {
            ...prev,
            [measurementId]: 0,
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

    const normalizedCreatedAt =
      normalizeTimestampString(createdAt) ?? createdAt;

    updateServerTimeOffset(normalizedCreatedAt);

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
                [measurementId]: normalizedCreatedAt,
              };
            }
            if (previousBoolean === null && !hasOnStartTime) {
              return {
                ...prevTimes,
                [measurementId]: normalizedCreatedAt,
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

        setOffStartTimes((prevTimes) => {
          const hasOffStartTime = prevTimes[measurementId] !== undefined;

          if (booleanValue === false) {
            if (previousBoolean === true) {
              return {
                ...prevTimes,
                [measurementId]: normalizedCreatedAt,
              };
            }
            if (previousBoolean === null && !hasOffStartTime) {
              return {
                ...prevTimes,
                [measurementId]: normalizedCreatedAt,
              };
            }

            return prevTimes;
          } else if (booleanValue === true && previousBoolean === false) {
            const newTimes = { ...prevTimes };

            delete newTimes[measurementId];

            return newTimes;
          }

          return prevTimes;
        });

        setStatusDurations((prevDurations) => {
          const existing = prevDurations[measurementId];
          if (existing === undefined) {
            return {
              ...prevDurations,
              [measurementId]: 0,
            };
          }

          if (previousBoolean !== null && previousBoolean !== booleanValue) {
            return {
              ...prevDurations,
              [measurementId]: 0,
            };
          }

          return prevDurations;
        });

        return {
          ...prev,
          [measurementId]: {
            value: newValue,
            timestamp: normalizedCreatedAt,
          },
        };
      });
    } else {
      setValues((prev) => ({
        ...prev,
        [measurementId]: {
          value: newValue,
          timestamp: normalizedCreatedAt,
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
    getOffStartTime: (measurementId: number) => offStartTimes[measurementId],
    getStatusDurationSeconds: (measurementId: number) =>
      statusDurations[measurementId],
    initializeValue,
  };
};

import { useState, useEffect, useCallback } from "react";

import { useWebSocket } from "@/contexts/WebSocketContext";

interface DataPoint {
  value: number;
  timestamp: Date;
}

type MeasurementData = Record<number, DataPoint[]>;

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

export interface ChartDataPoint {
  x: Date;
  y: number;
}

export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  borderColor: string;
  backgroundColor: string;
}

export const useRealtimeGroupChartData = (
  measurementIds: number[],
  timeRangeMinutes: number
) => {
  const { socket } = useWebSocket();
  const [data, setData] = useState<MeasurementData>({});

  const handleMeasurementValue = useCallback(
    (message: WebSocketMessage) => {
      const payload = message.data?.data ?? message.data;

      if (!payload?.measurementId) {
        return;
      }

      const { measurementId, value, createdAt } = payload;

      if (!value || !createdAt || !measurementIds.includes(measurementId)) {
        return;
      }

      const newValue = parseFloat(String(value));
      const timestamp = new Date(createdAt);

      setData((prev) => {
        const currentData = prev[measurementId] ?? [];
        const newDataPoint: DataPoint = { value: newValue, timestamp };
        const now = new Date();
        const cutoffTime = new Date(
          now.getTime() - timeRangeMinutes * 60 * 1000
        );
        const filteredData = currentData.filter(
          (point) => point.timestamp >= cutoffTime
        );

        return {
          ...prev,
          [measurementId]: [...filteredData, newDataPoint],
        };
      });
    },
    [measurementIds, timeRangeMinutes]
  );

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket.on("new_measurement_value", handleMeasurementValue);

    return () => {
      socket.off("new_measurement_value", handleMeasurementValue);
    };
  }, [socket, handleMeasurementValue]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const now = new Date();
        const cutoffTime = new Date(
          now.getTime() - timeRangeMinutes * 60 * 1000
        );
        const cleaned: MeasurementData = {};

        for (const [measurementId, points] of Object.entries(prev)) {
          const filtered = points.filter(
            (point) => point.timestamp >= cutoffTime
          );

          if (filtered.length > 0) {
            cleaned[Number(measurementId)] = filtered;
          }
        }

        return cleaned;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [timeRangeMinutes]);

  const getAllTimestamps = useCallback((): Date[] => {
    const timestamps = new Set<number>();

    for (const points of Object.values(data)) {
      for (const point of points) {
        timestamps.add(point.timestamp.getTime());
      }
    }

    return Array.from(timestamps)
      .map((time) => new Date(time))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [data]);

  const getValueAtTimestamp = useCallback(
    (measurementId: number, timestamp: Date): number | null => {
      const points = data[measurementId] ?? [];
      const targetTime = timestamp.getTime();
      const closest = points.reduce(
        (best, point) => {
          const diff = Math.abs(point.timestamp.getTime() - targetTime);

          if (diff < best.diff && diff < 5000) {
            return { point, diff };
          }

          return best;
        },
        { point: null as DataPoint | null, diff: Infinity }
      );

      return closest.point?.value ?? null;
    },
    [data]
  );

  return {
    data,
    getAllTimestamps,
    getValueAtTimestamp,
    getDataForMeasurement: (measurementId: number): DataPoint[] =>
      data[measurementId] ?? [],
  };
};

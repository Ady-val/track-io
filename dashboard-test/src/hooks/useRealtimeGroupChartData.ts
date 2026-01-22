import { useState, useEffect, useCallback, useRef } from "react";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { normalizeChartTimestamp } from "@/lib/dateTime";
import { updateServerTimeOffset } from "@/lib/timeSync";

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

export interface RealtimeChartPoint {
  measurementId: number;
  value: number;
  createdAt: string;
}

export const useRealtimeGroupChartData = (
  measurementIds: number[],
  _timeRangeMinutes: number,
  initialPoints: RealtimeChartPoint[] = []
) => {
  const { socket } = useWebSocket();
  const [data, setData] = useState<MeasurementData>({});
  const MAX_POINTS_PER_MEASUREMENT = 10000;
  const lastLogAtRef = useRef<number>(0);

  const insertSorted = useCallback(
    (points: DataPoint[], newPoint: DataPoint) => {
      if (points.length === 0) {
        return [newPoint];
      }

      const lastPoint = points[points.length - 1];
      if (newPoint.timestamp.getTime() >= lastPoint.timestamp.getTime()) {
        return [...points, newPoint];
      }

      let left = 0;
      let right = points.length - 1;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const midTime = points[mid].timestamp.getTime();
        const newTime = newPoint.timestamp.getTime();

        if (midTime === newTime) {
          const updated = points.slice();
          updated[mid] = newPoint;
          return updated;
        }

        if (midTime < newTime) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }

      const updated = points.slice();
      updated.splice(left, 0, newPoint);
      return updated;
    },
    []
  );

  const seedInitialData = useCallback(() => {
    const seeded: MeasurementData = {};

    initialPoints.forEach((point) => {
      if (!measurementIds.includes(point.measurementId)) {
        return;
      }

      const timestamp = normalizeChartTimestamp(point.createdAt);
      if (!timestamp) {
        return;
      }
      updateServerTimeOffset(point.createdAt);

      const existing = seeded[point.measurementId] ?? [];
      seeded[point.measurementId] = insertSorted(existing, {
        value: point.value,
        timestamp,
      });
    });

    for (const measurementId of Object.keys(seeded)) {
      const limited =
        seeded[Number(measurementId)].length > MAX_POINTS_PER_MEASUREMENT
          ? seeded[Number(measurementId)].slice(-MAX_POINTS_PER_MEASUREMENT)
          : seeded[Number(measurementId)];
      seeded[Number(measurementId)] = limited;
    }

    setData((prev) => {
      if (Object.keys(prev).length > 0) {
        return prev;
      }

      return seeded;
    });
  }, [initialPoints, measurementIds, insertSorted]);

  useEffect(() => {
    seedInitialData();
  }, [seedInitialData]);

  const handleMeasurementValue = useCallback(
    (message: WebSocketMessage) => {
      const payload = message.data?.data ?? message.data ?? message;

      if (!payload?.measurementId) {
        return;
      }

      const { measurementId, value, createdAt } = payload;
      const normalizedMeasurementId = Number(measurementId);

      if (
        value === undefined ||
        value === null ||
        value === "" ||
        !createdAt ||
        !Number.isFinite(normalizedMeasurementId) ||
        !measurementIds.includes(normalizedMeasurementId)
      ) {
        return;
      }

      // Only process numeric values for charts
      const newValue = parseFloat(String(value));

      if (isNaN(newValue)) {
        // Skip non-numeric values (e.g., boolean values for status type)
        return;
      }

      const timestamp = normalizeChartTimestamp(createdAt);
      if (!timestamp) {
        return;
      }
      updateServerTimeOffset(createdAt);

      const now = Date.now();
      if (now - lastLogAtRef.current > 5000) {
        lastLogAtRef.current = now;
        console.log("[RealtimeGroupChartData]", {
          measurementId: normalizedMeasurementId,
          createdAt,
          value: newValue,
          parsedTime: timestamp.toISOString(),
        });
      }

      setData((prev) => {
        const currentData = prev[normalizedMeasurementId] ?? [];
        const newDataPoint: DataPoint = { value: newValue, timestamp };
        const withNewPoint = insertSorted(currentData, newDataPoint);
        const limited =
          withNewPoint.length > MAX_POINTS_PER_MEASUREMENT
            ? withNewPoint.slice(-MAX_POINTS_PER_MEASUREMENT)
            : withNewPoint;

        return {
          ...prev,
          [normalizedMeasurementId]: limited,
        };
      });
    },
    [measurementIds]
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
    // No periodic cleanup; chart handles filtering for visualization
    return;
  }, []);

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

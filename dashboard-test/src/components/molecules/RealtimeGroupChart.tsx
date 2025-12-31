import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import type React from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";

import { Card, CardBody, Text } from "@components/atoms";

import { useRealtimeGroupChartData } from "@/hooks/useRealtimeGroupChartData";
import type { DashboardMeasurementItem } from "@/types/dashboard-measurement-group";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

interface ChartDatasetConfig {
  label: string;
  data: Array<number | null>;
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  pointRadius: number;
  pointHoverRadius: number;
  tension: number;
  fill: boolean;
  spanGaps: boolean;
}

export interface RealtimeGroupChartProps {
  timeRange: number;
  minValue: number;
  maxValue: number;
  measurementIds: number[];
  measurements: DashboardMeasurementItem[];
}

export const RealtimeGroupChart: React.FC<RealtimeGroupChartProps> = ({
  timeRange,
  minValue,
  maxValue,
  measurementIds,
  measurements,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const { getValueAtTimestamp, getDataForMeasurement } =
    useRealtimeGroupChartData(measurementIds, timeRange);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const allTimestamps = useMemo(() => {
    const now = currentTime;
    const startTime = new Date(now.getTime() - timeRange * 60 * 1000);
    const timestamps: Date[] = [];

    for (let time = startTime.getTime(); time <= now.getTime(); time += 1000) {
      timestamps.push(new Date(time));
    }

    return timestamps;
  }, [currentTime, timeRange]);

  const formatTimestamp = useCallback((timestamp: Date): string => {
    const hours = timestamp.getHours().toString().padStart(2, "0");
    const minutes = timestamp.getMinutes().toString().padStart(2, "0");
    const seconds = timestamp.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
  }, []);

  const labels = useMemo(
    () => allTimestamps.map(formatTimestamp),
    [allTimestamps, formatTimestamp]
  );

  const chartColors = useMemo(() => {
    return [
      "rgb(59, 130, 246)",
      "rgb(16, 185, 129)",
      "rgb(245, 158, 11)",
      "rgb(239, 68, 68)",
      "rgb(139, 92, 246)",
      "rgb(236, 72, 153)",
      "rgb(6, 182, 212)",
      "rgb(34, 197, 94)",
      "rgb(251, 191, 36)",
      "rgb(249, 115, 22)",
    ];
  }, []);

  const datasets = useMemo(() => {
    return measurementIds
      .map((measurementId, index) => {
        const measurement = measurements.find(
          (m) => m.measurementId === measurementId
        );

        if (!measurement) return null;

        const measurementData = getDataForMeasurement(measurementId);
        const dataMap = new Map<number, number>();

        measurementData.forEach((point) => {
          dataMap.set(point.timestamp.getTime(), point.value);
        });

        const dataPoints = allTimestamps.map((timestamp) => {
          const timestampMs = timestamp.getTime();
          const exactValue = dataMap.get(timestampMs);

          if (exactValue !== undefined) {
            return exactValue;
          }
          const closestValue = getValueAtTimestamp(measurementId, timestamp);

          return closestValue ?? null;
        });

        const colorIndex = index % chartColors.length;
        const color = chartColors[colorIndex] ?? "rgb(59, 130, 246)";
        const alphaColor = color.replace("rgb", "rgba").replace(")", ", 0.2)");

        return {
          label: measurement.measurement.name,
          data: dataPoints,
          borderColor: color,
          backgroundColor: alphaColor,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0,
          fill: false,
          spanGaps: false,
        };
      })
      .filter((ds): ds is ChartDatasetConfig => ds !== null);
  }, [
    measurementIds,
    measurements,
    allTimestamps,
    getValueAtTimestamp,
    chartColors,
    getDataForMeasurement,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const existingChart = ChartJS.getChart(ctx);

    if (existingChart) {
      existingChart.destroy();
    }

    const chartConfig: ChartConfiguration<"line"> = {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "rgba(255, 255, 255, 0.7)",
              font: {
                size: 12,
              },
              usePointStyle: true,
              padding: 15,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;

                if (value === null) {
                  return `${context.dataset.label}: N/A`;
                }

                return `${context.dataset.label}: ${value.toFixed(2)}`;
              },
            },
          },
          annotation: {
            annotations: {
              minLine: {
                type: "line",
                yMin: minValue,
                yMax: minValue,
                borderColor: "rgba(251, 191, 36, 0.5)",
                borderWidth: 1,
                borderDash: [5, 5],
              },
              maxLine: {
                type: "line",
                yMin: maxValue,
                yMax: maxValue,
                borderColor: "rgba(239, 68, 68, 0.5)",
                borderWidth: 1,
                borderDash: [5, 5],
              },
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
              drawOnChartArea: true,
              drawTicks: true,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              font: {
                size: 10,
              },
              maxRotation: 45,
              minRotation: 45,
              maxTicksLimit: 20,
            },
          },
          y: {
            display: true,
            min: minValue,
            max: maxValue,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
              drawOnChartArea: true,
              drawTicks: true,
            },
            ticks: {
              color: "rgba(255, 255, 255, 0.7)",
              font: {
                size: 10,
              },
              callback: (value) => {
                if (typeof value === "number") {
                  return value.toFixed(1);
                }

                return value;
              },
            },
          },
        },
        animation: {
          duration: 0,
        },
      },
    };

    try {
      chartRef.current = new ChartJS(ctx, chartConfig);
    } catch (error) {
      console.error("Error creating chart:", error);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [minValue, maxValue, timeRange, labels, datasets]);

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    chartRef.current.data.labels = labels;
    chartRef.current.data.datasets = datasets;
    chartRef.current.update("none");
  }, [datasets, labels]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!chartRef.current) {
        return;
      }

      const now = new Date();
      const startTime = new Date(now.getTime() - timeRange * 60 * 1000);
      const newTimestamps: Date[] = [];

      for (
        let time = startTime.getTime();
        time <= now.getTime();
        time += 1000
      ) {
        newTimestamps.push(new Date(time));
      }

      const newLabels = newTimestamps.map(formatTimestamp);

      chartRef.current.data.labels = newLabels;

      const newDatasets = measurementIds
        .map((measurementId, index) => {
          const measurement = measurements.find(
            (m) => m.measurementId === measurementId
          );

          if (!measurement) return null;

          const measurementData = getDataForMeasurement(measurementId);
          const dataMap = new Map<number, number>();

          measurementData.forEach((point) => {
            if (point.timestamp >= startTime && point.timestamp <= now) {
              dataMap.set(point.timestamp.getTime(), point.value);
            }
          });

          const dataPoints = newTimestamps.map((timestamp) => {
            const timestampMs = timestamp.getTime();
            const exactValue = dataMap.get(timestampMs);

            if (exactValue !== undefined) {
              return exactValue;
            }
            const closestValue = getValueAtTimestamp(measurementId, timestamp);

            return closestValue ?? null;
          });

          const colorIndex = index % chartColors.length;
          const color = chartColors[colorIndex] ?? "rgb(59, 130, 246)";
          const alphaColor = color
            .replace("rgb", "rgba")
            .replace(")", ", 0.2)");

          return {
            label: measurement.measurement.name,
            data: dataPoints,
            borderColor: color,
            backgroundColor: alphaColor,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0,
            fill: false,
            spanGaps: false,
          };
        })
        .filter((ds): ds is ChartDatasetConfig => ds !== null);

      chartRef.current.data.datasets = newDatasets;
      chartRef.current.update("none");
    }, 1000);

    return () => clearInterval(interval);
  }, [
    measurementIds,
    measurements,
    timeRange,
    getDataForMeasurement,
    getValueAtTimestamp,
    chartColors,
    formatTimestamp,
  ]);

  return (
    <Card className="bg-slate-700/50 border-slate-600 h-full flex flex-col">
      <CardBody className="p-4 flex flex-col flex-1 min-h-0">
        <div className="mb-4 flex-shrink-0 flex items-center justify-between">
          <Text className="text-lg font-semibold text-slate-100" variant="h4">
            Gráfica en Tiempo Real
          </Text>
          <Text className="text-xs text-slate-400" variant="caption">
            Mostrando últimos {timeRange} minutos
          </Text>
        </div>

        <div className="w-full flex-1 min-h-0 overflow-hidden">
          <canvas ref={canvasRef} />
        </div>
      </CardBody>
    </Card>
  );
};

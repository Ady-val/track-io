import { useEffect, useRef, useMemo, useCallback } from "react";
import type React from "react";

import {
  Chart as ChartJS,
  TimeScale,
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
import "chartjs-adapter-dayjs-4";

import { Card, CardBody, Text } from "@components/atoms";

import {
  type RealtimeChartPoint,
  useRealtimeGroupChartData,
} from "@/hooks/useRealtimeGroupChartData";
import { getServerNow } from "@/lib/timeSync";
import type { DashboardMeasurementItem } from "@/types/dashboard-measurement-group";

ChartJS.register(
  TimeScale,
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
  data: Array<{ x: number; y: number }>;
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
  initialPoints?: RealtimeChartPoint[];
}

const getTimeScaleConfig = (timeRangeMinutes: number) => {
  if (timeRangeMinutes <= 10) {
    return {
      unit: "second" as const,
      stepSize: 1,
      displayFormats: { second: "HH:mm:ss" },
    };
  }
  if (timeRangeMinutes <= 60) {
    return {
      unit: "minute" as const,
      stepSize: 1,
      displayFormats: { minute: "HH:mm" },
    };
  }
  if (timeRangeMinutes <= 240) {
    return {
      unit: "minute" as const,
      stepSize: 5,
      displayFormats: { minute: "HH:mm" },
    };
  }

  return {
    unit: "hour" as const,
    stepSize: 1,
    displayFormats: { hour: "HH:mm" },
  };
};

const getTimeScaleStepMs = (config: ReturnType<typeof getTimeScaleConfig>) => {
  const unitToMs = {
    second: 1000,
    minute: 60_000,
    hour: 3_600_000,
  } as const;

  return unitToMs[config.unit] * config.stepSize;
};

export const RealtimeGroupChart: React.FC<RealtimeGroupChartProps> = ({
  timeRange,
  minValue,
  maxValue,
  measurementIds,
  measurements,
  initialPoints = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS<"line"> | null>(null);
  const lastLogAtRef = useRef<number>(0);

  const { getDataForMeasurement } = useRealtimeGroupChartData(
    measurementIds,
    timeRange,
    initialPoints
  );

  const timeScaleConfig = useMemo(
    () => getTimeScaleConfig(timeRange),
    [timeRange]
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

  const buildChartData = useCallback(() => {
    const rangeMs = timeRange * 60 * 1000;
    let latestTimeMs = 0;

    measurementIds.forEach((measurementId) => {
      const points = getDataForMeasurement(measurementId);
      const lastPoint = points[points.length - 1];

      if (lastPoint) {
        latestTimeMs = Math.max(latestTimeMs, lastPoint.timestamp.getTime());
      }
    });

    const nowMs = getServerNow();
    const rawEndTimeMs = Math.max(nowMs, latestTimeMs + 1000);
    const snapMs = Math.max(1000, getTimeScaleStepMs(timeScaleConfig));
    const endTimeMs = Math.floor(rawEndTimeMs / snapMs) * snapMs;
    const startTimeMs = endTimeMs - rangeMs;

    const datasets = measurementIds
      .map((measurementId, index) => {
        const measurement = measurements.find(
          (m) => m.measurementId === measurementId
        );

        if (!measurement) return null;

        // Get all data points and filter within range (with buffer for timing differences)
        const allData = getDataForMeasurement(measurementId);

        const filteredData = allData
          .filter((point) => {
            const pointTime = point.timestamp.getTime();

            return pointTime >= startTimeMs && pointTime <= endTimeMs;
          })
          .map((point) => ({ x: point.timestamp.getTime(), y: point.value }));

        const maxGapMs = 5000;
        const withGapBreaks: Array<{ x: number; y: number | null }> = [];

        for (const current of filteredData) {
          const previous = withGapBreaks[withGapBreaks.length - 1];

          if (
            previous &&
            previous.y !== null &&
            current.x - previous.x > maxGapMs
          ) {
            withGapBreaks.push({ x: previous.x + 1, y: null });
          }

          withGapBreaks.push(current);
        }

        const maxHoldMs = 5000;
        const lastBeforeRange = (() => {
          for (let i = allData.length - 1; i >= 0; i -= 1) {
            const point = allData[i];

            if (point && point.timestamp.getTime() <= startTimeMs) {
              return point;
            }
          }

          return null;
        })();

        if (
          lastBeforeRange &&
          startTimeMs - lastBeforeRange.timestamp.getTime() <= maxHoldMs &&
          (withGapBreaks.length === 0 || withGapBreaks[0]?.x !== startTimeMs)
        ) {
          withGapBreaks.unshift({
            x: startTimeMs,
            y: lastBeforeRange.value,
          });
        }

        const lastPoint = withGapBreaks[withGapBreaks.length - 1];

        if (
          lastPoint &&
          lastPoint.x < endTimeMs &&
          endTimeMs - lastPoint.x <= maxHoldMs
        ) {
          withGapBreaks.push({
            x: endTimeMs,
            y: lastPoint.y,
          });
        }

        const colorIndex = index % chartColors.length;
        const color = chartColors[colorIndex] ?? "rgb(59, 130, 246)";
        const alphaColor = color.replace("rgb", "rgba").replace(")", ", 0.2)");

        return {
          label: measurement.measurement.name,
          data: withGapBreaks,
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

    const now = Date.now();

    if (now - lastLogAtRef.current > 5000) {
      lastLogAtRef.current = now;
      console.log("[RealtimeGroupChart]", {
        timeRange,
        nowMs,
        latestTimeMs,
        startTimeMs,
        endTimeMs,
        measurementIds,
      });

      measurementIds.forEach((measurementId) => {
        const measurement = measurements.find(
          (m) => m.measurementId === measurementId
        );
        const points = getDataForMeasurement(measurementId);
        const lastPoint = points[points.length - 1];

        console.log("[RealtimeGroupChart]", {
          measurementId,
          measurementName: measurement?.measurement?.name ?? "unknown",
          totalPoints: points.length,
          lastPointTime: lastPoint?.timestamp?.toISOString?.() ?? null,
          lastPointValue: lastPoint?.value ?? null,
          filteredPoints:
            datasets.find((ds) => ds.label === measurement?.measurement?.name)
              ?.data.length ?? 0,
        });
      });
    }

    return { datasets, startTimeMs, endTimeMs };
  }, [
    measurementIds,
    measurements,
    getDataForMeasurement,
    chartColors,
    timeRange,
    timeScaleConfig,
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

    const { datasets, startTimeMs, endTimeMs } = buildChartData();
    const chartConfig: ChartConfiguration<
      "line",
      Array<{ x: number; y: number }>
    > = {
      type: "line",
      data: {
        datasets,
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
            type: "time",
            display: true,
            min: startTimeMs,
            max: endTimeMs,
            time: timeScaleConfig,
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
  }, [minValue, maxValue, timeRange, buildChartData, timeScaleConfig]);

  // Update chart time range and datasets every second for smooth scrolling
  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const updateChart = () => {
      const { datasets, startTimeMs, endTimeMs } = buildChartData();

      if (!chartRef.current) {
        return;
      }

      chartRef.current.data.datasets = datasets;
      if (chartRef.current.options.scales?.x) {
        chartRef.current.options.scales.x.min = startTimeMs;
        chartRef.current.options.scales.x.max = endTimeMs;
      }

      chartRef.current.update("none");
    };

    updateChart();
    const interval = setInterval(updateChart, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [buildChartData]);

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

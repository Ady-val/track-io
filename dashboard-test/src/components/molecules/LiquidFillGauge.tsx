import { useEffect, useRef } from "react";
import type React from "react";

import { FaEdit, FaTrash } from "react-icons/fa";

import { Card, CardBody, Text } from "@components/atoms";
import { formatLocalDateTime } from "@/lib/dateTime";

import { useAdaptiveTitleSize } from "@/hooks/useAdaptiveTitleSize";
import { getMeasurementConfig } from "@/lib/measurementUtils";
import { type GaugeChartProps } from "./GaugeChart";

export const LiquidFillGauge: React.FC<GaugeChartProps> = ({
  title,
  subtitle,
  value,
  minValue,
  maxValue,
  type,
  timestamp,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wavePhaseRef = useRef(0);
  const currentFillRef = useRef(0);
  const targetFillRef = useRef(0);
  const animationFromRef = useRef(0);
  const animationStartRef = useRef<number | null>(null);
  const lastTimestampRef = useRef(0);
  const initializedRef = useRef(false);
  const valueRef = useRef<number | undefined>(value);
  const minValueRef = useRef(minValue);
  const maxValueRef = useRef(maxValue);
  const dotPatternRef = useRef<CanvasPattern | null>(null);
  const dotPatternColorRef = useRef<string | null>(null);
  const config = getMeasurementConfig(type);
  const Icon = config.icon;

  useEffect(() => {
    valueRef.current = value;
    minValueRef.current = minValue;
    maxValueRef.current = maxValue;
  }, [value, minValue, maxValue]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const createDotPattern = (color: string) => {
      const patternCanvas = document.createElement("canvas");
      const size = 8;
      patternCanvas.width = size;
      patternCanvas.height = size;
      const patternCtx = patternCanvas.getContext("2d");
      if (!patternCtx) {
        return null;
      }
      patternCtx.clearRect(0, 0, size, size);
      patternCtx.fillStyle = color;
      patternCtx.beginPath();
      patternCtx.arc(size / 2, size / 2, 1.6, 0, Math.PI * 2);
      patternCtx.fill();
      return ctx.createPattern(patternCanvas, "repeat");
    };

    const drawWave = (
      fillTopY: number,
      amplitude: number,
      frequency: number,
      phase: number,
      fillColor: string | CanvasPattern,
      alpha: number,
      _width: number,
      height: number,
      centerX: number,
      radius: number
    ) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      const leftX = centerX - radius;
      const rightX = centerX + radius;
      ctx.moveTo(leftX, fillTopY);

      for (let x = leftX; x <= rightX; x += 2) {
        const y = fillTopY + amplitude * Math.sin(frequency * x + phase);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(rightX, height + radius);
      ctx.lineTo(leftX, height + radius);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    dotPatternRef.current = null;
    dotPatternColorRef.current = null;

    const drawLiquid = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const size = Math.min(width, height);
      const radius = size / 2 - 4;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const borderColor = config.color;
      const baseColor = config.color;
      const isDottedFill = type === "ppm";
      let fillStyle: string | CanvasPattern = baseColor;

      if (isDottedFill) {
        if (dotPatternColorRef.current !== baseColor || !dotPatternRef.current) {
          dotPatternRef.current = createDotPattern(baseColor);
          dotPatternColorRef.current = baseColor;
        }
        if (dotPatternRef.current) {
          fillStyle = dotPatternRef.current;
        }
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.clip();

      const fillLevel = currentFillRef.current;
      const liquidHeight = radius * 2 * (1 - fillLevel);
      const fillTopY = centerY - radius + liquidHeight;

      ctx.globalAlpha = isDottedFill ? 0.8 : 0.45;
      ctx.fillStyle = fillStyle;
      ctx.fillRect(centerX - radius, fillTopY, radius * 2, radius * 2);

      const waveLength = radius * 1.5;
      const frequency = (2 * Math.PI) / waveLength;
      const basePhase = wavePhaseRef.current;
      const amplitude = Math.max(3, radius * 0.05);

      drawWave(
        fillTopY,
        amplitude,
        frequency,
        basePhase,
        fillStyle,
        0.8,
        width,
        height,
        centerX,
        radius
      );

      drawWave(
        fillTopY + amplitude * 0.4,
        amplitude * 0.6,
        frequency * 1.2,
        basePhase + Math.PI / 2,
        fillStyle,
        0.6,
        width,
        height,
        centerX,
        radius
      );

      ctx.restore();

    };

    const animate = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const elapsed = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      wavePhaseRef.current += elapsed * 0.004;

      if (animationStartRef.current !== null) {
        const progress = Math.min(
          1,
          (timestamp - animationStartRef.current) / 800
        );
        const start = animationFromRef.current;
        const target = targetFillRef.current;
        currentFillRef.current = start + (target - start) * progress;
        if (progress >= 1) {
          currentFillRef.current = target;
          animationStartRef.current = null;
        }
      }

      drawLiquid();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [config.color, type]);

  useEffect(() => {
    const min = parseFloat(minValue.toString());
    const max = parseFloat(maxValue.toString());
    const clampedValue =
      value !== undefined ? Math.max(min, Math.min(max, value)) : 0;
    const range = max - min;
    const nextFill =
      range > 0 && value !== undefined ? (clampedValue - min) / range : 0;

    if (!initializedRef.current) {
      currentFillRef.current = nextFill;
      targetFillRef.current = nextFill;
      initializedRef.current = true;
      return;
    }

    animationFromRef.current = currentFillRef.current;
    targetFillRef.current = nextFill;
    animationStartRef.current = performance.now();
  }, [value, minValue, maxValue]);

  const getValueColor = () => {
    if (value === undefined) {
      return "text-slate-400";
    }
    const min = parseFloat(minValue.toString());
    const max = parseFloat(maxValue.toString());

    if (value < min || value > max) {
      return "text-red-400";
    }

    return "text-slate-100";
  };

  const hasValue = value !== undefined;
  const { titleRef, titleClassName } = useAdaptiveTitleSize({
    title,
    baseSize: "lg",
  });

  const formattedTimestamp = formatLocalDateTime(timestamp);

  return (
    <Card className="h-[25rem] w-[25rem] bg-slate-800/50 border-slate-700 group relative">
      <CardBody className="p-6">
        {showActions && (onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {onEdit && (
              <button
                aria-label="Editar"
                className="w-7 h-7 rounded bg-yellow-600/80 hover:bg-yellow-600 text-white flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <FaEdit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                aria-label="Eliminar"
                className="w-7 h-7 rounded bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <FaTrash className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0 min-w-0">
              <div className="flex-shrink-0" style={{ color: config.color }}>
                <Icon className="w-4 h-4" />
              </div>
              <div ref={titleRef} className={titleClassName}>
                {title}
              </div>
            </div>
            <Text
              className="text-xs text-slate-400"
              color="muted"
              variant="caption"
            >
              {subtitle}
            </Text>
          </div>
        </div>

        <div className="grow relative mb-3 flex items-center justify-center min-h-[220px] w-full overflow-hidden">
          <div className="relative w-full h-full max-w-[320px] max-h-[176px] flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className={`text-4xl font-bold ${getValueColor()}`}>
                {hasValue ? value.toFixed(1) : "N/A"}
              </div>
              <div className="text-sm text-slate-400">
                {hasValue ? config.unit : ""}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-base">
          <div className="text-slate-400">
            Min:{" "}
            <span className="text-slate-200 font-bold text-lg">
              {parseFloat(minValue.toString())}
            </span>
          </div>
          <div className="text-slate-400">
            Max:{" "}
            <span className="text-slate-200 font-bold text-lg">
              {parseFloat(maxValue.toString())}
            </span>
          </div>
        </div>
        <div className="mt-1 text-center">
          <Text className="text-xs text-slate-500" variant="caption">
            {hasValue && formattedTimestamp
              ? `Actualizado: ${formattedTimestamp}`
              : "Esperando señal"}
          </Text>
        </div>
      </CardBody>
    </Card>
  );
};

import { useEffect, useMemo, useRef, useState } from "react";

function formatDurationFromSeconds(totalSeconds: number): string {
  if (totalSeconds < 0) {
    return "00:00:00";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export const useDurationTicker = (
  baseDurationSeconds: number | null | undefined,
  isActive: boolean
) => {
  const baseSeconds =
    typeof baseDurationSeconds === "number" && baseDurationSeconds >= 0
      ? baseDurationSeconds
      : 0;

  const baseDuration = useMemo(
    () => (isActive ? formatDurationFromSeconds(baseSeconds) : "00:00:00"),
    [baseSeconds, isActive]
  );

  const [duration, setDuration] = useState<string>(baseDuration);
  const baseRef = useRef<number>(baseSeconds);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive || baseDurationSeconds === null || baseDurationSeconds === undefined) {
      setDuration("00:00:00");
      return;
    }

    baseRef.current = baseSeconds;
    startRef.current = performance.now();
    setDuration(formatDurationFromSeconds(baseSeconds));
  }, [baseSeconds, baseDurationSeconds, isActive]);

  useEffect(() => {
    if (!isActive || baseDurationSeconds === null || baseDurationSeconds === undefined) {
      return;
    }

    const tick = () => {
      const elapsedSeconds = (performance.now() - startRef.current) / 1000;
      const totalSeconds = baseRef.current + elapsedSeconds;
      setDuration(formatDurationFromSeconds(totalSeconds));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [baseDurationSeconds, isActive]);

  return duration;
};

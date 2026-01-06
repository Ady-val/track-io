import { useState, useEffect, useCallback, useMemo } from "react";

function formatDuration(startTime: Date): string {
  const now = new Date();
  const diff = now.getTime() - startTime.getTime();

  if (diff < 0) {
    return "00:00:00";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export const useStatusDuration = (
  onStartTime: string | undefined,
  isOn: boolean | null | undefined
) => {
  const [duration, setDuration] = useState<string>("00:00:00");

  const isActive = useMemo(() => {
    if (isOn !== true || !onStartTime || onStartTime.trim() === "") {
      return false;
    }

    try {
      const startTime = new Date(onStartTime);

      if (!isValidDate(startTime)) {
        return false;
      }
      const now = new Date();

      return startTime.getTime() <= now.getTime();
    } catch {
      return false;
    }
  }, [isOn, onStartTime]);

  const updateDuration = useCallback(() => {
    if (!onStartTime || !isOn) {
      setDuration("00:00:00");

      return;
    }

    try {
      const startTime = new Date(onStartTime);

      if (!isValidDate(startTime)) {
        setDuration("00:00:00");

        return;
      }

      const formatted = formatDuration(startTime);

      setDuration(formatted);
    } catch (error) {
      console.error("Error calculating duration:", error);
      setDuration("00:00:00");
    }
  }, [onStartTime, isOn]);

  useEffect(() => {
    if (!isActive) {
      setDuration("00:00:00");

      return;
    }

    updateDuration();

    const interval = setInterval(updateDuration, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, updateDuration]);

  return {
    duration,
    isActive,
  };
};

import { useState, useEffect, useCallback, useMemo } from "react";
import { getServerNow } from "@/lib/timeSync";

/**
 * Parses an ISO date string to UTC timestamp (milliseconds since epoch)
 * All dates from server are in UTC, so we parse them as UTC timestamps
 */
function parseUTCTimestamp(isoString: string): number | null {
  try {
    const date = new Date(isoString);
    // getTime() always returns UTC timestamp regardless of timezone
    return date.getTime();
  } catch {
    return null;
  }
}

/**
 * Formats duration from milliseconds to HH:MM:SS
 */
function formatDurationFromMilliseconds(milliseconds: number): string {
  if (milliseconds < 0) {
    return "00:00:00";
  }

  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function calculateElapsedMs(
  startTime: string | undefined,
  isActiveCondition: boolean
): number | null {
  if (!startTime || !isActiveCondition) {
    return null;
  }

  const startTimestamp = parseUTCTimestamp(startTime);
  if (startTimestamp === null) {
    return null;
  }

  return getServerNow() - startTimestamp;
}

export const useStatusDuration = (
  startTime: string | undefined,
  isActiveCondition: boolean
) => {

  const initialDuration = useMemo(() => {
    const elapsed = calculateElapsedMs(startTime, isActiveCondition);
    if (elapsed === null) {
      return "00:00:00";
    }

    return formatDurationFromMilliseconds(elapsed);
  }, [startTime, isActiveCondition]);

  const [duration, setDuration] = useState<string>(initialDuration);

  const isActive = useMemo(() => {
    if (!isActiveCondition || !startTime || !startTime.trim()) {
      return false;
    }

    const startTimestamp = parseUTCTimestamp(startTime);
    if (startTimestamp === null) {
      return false;
    }

    const now = getServerNow();
    return isActiveCondition === true ? true : startTimestamp <= now;
  }, [isActiveCondition, startTime]);

  const updateDuration = useCallback(() => {
    if (!startTime || !isActiveCondition) {
      setDuration("00:00:00");
      return;
    }

    const startTimestamp = parseUTCTimestamp(startTime);
    if (startTimestamp === null) {
      setDuration("00:00:00");
      return;
    }

    // Calculate elapsed time in milliseconds (both timestamps are UTC)
    const now = getServerNow();
    let elapsed = now - startTimestamp;
    
    // VERSION 2.0: If backend says it's active, trust it even if startTime is in future
    // The formatDurationFromMilliseconds function already handles negative values (returns "00:00:00")
    // So we don't need to clamp to 0 - let it show 00:00:00 until client time catches up
    // Only clamp if NOT active and future (shouldn't happen, but safety check)
    if (elapsed < 0 && !isActiveCondition) {
      // If not active and future, definitely 0
      elapsed = 0;
    }
    // If elapsed < 0 && isActiveCondition === true, we let it be negative
    // formatDurationFromMilliseconds will return "00:00:00" for negative values
    // This allows the counter to start when client time catches up
    
    const formatted = formatDurationFromMilliseconds(elapsed);
    setDuration(formatted);
  }, [startTime, isActiveCondition]);

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
  }, [isActive, updateDuration, startTime, isActiveCondition]);

  useEffect(() => {
    setDuration(initialDuration);
  }, [initialDuration]);

  return {
    duration,
    isActive,
  };
};

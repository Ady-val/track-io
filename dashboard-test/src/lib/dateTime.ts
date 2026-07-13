import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const timezonePattern = /[zZ]$|[+-]\d{2}:\d{2}$|[+-]\d{2}\d{2}$/;

export function parseTimestamp(timestamp?: string): Date | null {
  if (!timestamp) {
    return null;
  }

  const trimmed = timestamp.trim();
  if (!trimmed) {
    return null;
  }

  const hasTimezone = timezonePattern.test(trimmed);
  let parsed = hasTimezone ? dayjs.utc(trimmed) : dayjs(trimmed);

  if (!parsed.isValid() && trimmed.includes(" ")) {
    const normalized = trimmed.replace(" ", "T");
    parsed = hasTimezone ? dayjs.utc(normalized) : dayjs(normalized);
  }

  if (!parsed.isValid()) {
    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  return parsed.toDate();
}

export function normalizeTimestampString(timestamp?: string): string | undefined {
  const parsed = parseTimestamp(timestamp);
  return parsed ? parsed.toISOString() : undefined;
}

export function formatLocalDateTime(timestamp?: string): string | null {
  if (!timestamp) {
    return null;
  }

  const trimmed = timestamp.trim();
  if (!trimmed) {
    return null;
  }

  const hasTimezone = timezonePattern.test(trimmed);
  let parsed = hasTimezone ? dayjs.utc(trimmed) : dayjs(trimmed);
  if (!parsed.isValid()) {
    if (trimmed.includes(" ")) {
      const normalized = trimmed.replace(" ", "T");
      parsed = hasTimezone ? dayjs.utc(normalized) : dayjs(normalized);
    }
    if (!parsed.isValid()) {
      return null;
    }
  }

  const now = dayjs();
  const maxFutureSkewMinutes = 5;
  if (parsed.isAfter(now.add(maxFutureSkewMinutes, "minute"))) {
    const offsetMinutes = new Date().getTimezoneOffset();
    parsed = parsed.subtract(offsetMinutes, "minute");
  }

  return parsed.local().format("D/M/YYYY h:mm:ss A");
}

export function diffSecondsUtc(
  startTimestamp?: string,
  endTimestamp?: string
): number | null {
  if (!startTimestamp || !endTimestamp) {
    return null;
  }

  const start = dayjs.utc(startTimestamp);
  const end = dayjs.utc(endTimestamp);
  if (!start.isValid() || !end.isValid()) {
    return null;
  }

  const diffSeconds = end.diff(start, "second");
  return diffSeconds < 0 ? 0 : diffSeconds;
}

export function normalizeChartTimestamp(timestamp?: string): Date | null {
  if (!timestamp) {
    return null;
  }

  const trimmed = timestamp.trim();
  if (!trimmed) {
    return null;
  }

  const hasTimezone = timezonePattern.test(trimmed);
  let parsed = hasTimezone ? dayjs.utc(trimmed) : dayjs(trimmed);

  if (!parsed.isValid() && trimmed.includes(" ")) {
    const normalized = trimmed.replace(" ", "T");
    parsed = hasTimezone ? dayjs.utc(normalized) : dayjs(normalized);
  }

  if (!parsed.isValid()) {
    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  return parsed.toDate();
}

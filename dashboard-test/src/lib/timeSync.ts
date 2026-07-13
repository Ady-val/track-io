let serverTimeOffsetMs = 0;
let hasServerTimeOffset = false;

export function updateServerTimeOffset(serverIsoString: string): void {
  const serverTimestamp = Date.parse(serverIsoString);
  if (Number.isNaN(serverTimestamp)) {
    return;
  }

  const clientTimestamp = Date.now();
  serverTimeOffsetMs = serverTimestamp - clientTimestamp;
  hasServerTimeOffset = true;
}

export function getServerNow(): number {
  return hasServerTimeOffset ? Date.now() + serverTimeOffsetMs : Date.now();
}

export function getServerTimeOffsetMs(): number | null {
  return hasServerTimeOffset ? serverTimeOffsetMs : null;
}

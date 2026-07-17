/**
 * Formateo de duraciones para el dashboard de paros. Único lugar donde segundos
 * → texto legible, para no repetir la lógica en cada componente (§8.3).
 */

/** Segundos → 'Xh Ym' (o 'Ym Zs' / 'Zs' según magnitud). Nunca redondea a 0 min algo > 0. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  const total = Math.max(0, Math.round(seconds));

  if (total === 0) return "0s";

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;

  return `${s}s`;
}

/** Disponibilidad (0..1) → 'XX.X%'. null → '—' (nunca '0%' ni 'NaN'). */
export function formatAvailability(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";

  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Instante ISO → 'YYYY-MM-DD HH:mm' en HORA DE PLANTA (§8.7): un supervisor
 * conectado desde otra ciudad debe ver la hora de la planta, no la del navegador.
 */
export function formatPlantTime(
  iso: string | null | undefined,
  timeZone: string
): string {
  if (!iso) return "—";
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) return "—";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  const hour = map.hour === "24" ? "00" : map.hour;

  return `${map.year}-${map.month}-${map.day} ${hour}:${map.minute}`;
}

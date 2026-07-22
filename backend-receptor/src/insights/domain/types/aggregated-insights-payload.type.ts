/**
 * Payload agregado que se envía al modelo. Es lo ÚNICO que ve la IA: nunca
 * eventos individuales, nunca datos personales más allá de nombres de
 * área/departamento/señal. Diseñado para ser compacto — su tamaño depende de
 * (áreas × departamentos + 24 horas + 7 días + N señales), no de la cantidad
 * de eventos del periodo (ver backend-receptor/src/insights § escalabilidad).
 *
 * Todos los tiempos están en MINUTOS (ver EventInsightsAggregator — la
 * conversión segundos→minutos ocurre una sola vez, ahí).
 */
export interface AggregatedInsightsPayload {
  range: { startDate: string; endDate: string; days: number };
  totals: {
    totalEvents: number;
    totalActiveMinutes: number;
    totalDowntimeMinutes: number;
    /** La cifra "honesta": paro no programado, excluyendo paros programados. */
    totalDowntimeMinutesExcludingScheduled: number;
    /** % de eventos cerrados con al menos una alerta de nivel `alert` enviada. */
    escalatedToAlertPct: number;
    /** % de eventos cerrados que llegaron a escalamiento nivel 2. */
    escalatedToLevel2Pct: number;
  };
  byAreaDepartment: Array<{
    areaId: number;
    areaName: string;
    departmentId: number;
    departmentName: string;
    eventCount: number;
    totalMinutes: number;
    avgMinutes: number;
    escalatedToAlertPct: number;
  }>;
  /** Hora de pared de la planta (0-23), ver ConfigService plant.timezone. */
  byHourOfDay: Array<{ hour: number; eventCount: number; avgMinutes: number }>;
  /** Día de la semana de planta (0=domingo … 6=sábado). */
  byDayOfWeek: Array<{ dow: number; eventCount: number; avgMinutes: number }>;
  /** Motivo en texto libre (Event.reason). Vacío si nadie lo capturó. */
  byReason: Array<{
    reason: string;
    eventCount: number;
    totalMinutes: number;
  }>;
  topSignalsByDuration: Array<{
    signalId: number;
    signalName: string;
    areaName: string;
    departmentName: string;
    totalMinutes: number;
    eventCount: number;
    escalatedToAlertPct: number;
  }>;
  /** null si no hubo eventos de la botonera virtual en el periodo. */
  virtualDeviceSummary: {
    eventCount: number;
    withReasonPct: number;
    withCloseCommentPct: number;
  } | null;
}

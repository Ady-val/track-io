import type { InsightLanguage } from '../dtos/analyze-insights.dto';
import type { GroupBy } from '../../../reports/application/services/plant-time.util';

export interface InsightsPromptOptions {
  groupBy: GroupBy;
  smallSample: boolean;
}

const GROUPBY_FRAMING: Record<GroupBy, { es: string; en: string }> = {
  day: {
    es: 'Compara día contra día usando los buckets de "byPeriod" (ej. "el martes concentró X") y señala qué día se sale del patrón.',
    en: 'Compare day against day using the "byPeriod" buckets (e.g. "Tuesday concentrated X") and flag which day breaks the pattern.',
  },
  week: {
    es: 'Compara esta semana contra la anterior usando los buckets de "byPeriod" (ej. "esta semana vs la anterior") y señala la variación.',
    en: 'Compare this week against the previous one using the "byPeriod" buckets (e.g. "this week vs the previous one") and flag the variation.',
  },
  month: {
    es: 'Compara mes contra mes usando los buckets de "byPeriod" y señala la variación entre meses.',
    en: 'Compare month against month using the "byPeriod" buckets and flag the variation between months.',
  },
};

const GROUPBY_NAME: Record<GroupBy, string> = {
  day: 'día',
  week: 'semana',
  month: 'mes',
};

/**
 * System prompt versionado. Cambios aquí deben revisarse como cambios de
 * contrato: el shape del JSON de salida es parseado defensivamente por
 * AnthropicInsightsClient.parseFindings() y luego validado contra el payload
 * por InsightsService.resolveAndValidate().
 */
export function buildInsightsSystemPrompt(
  language: InsightLanguage,
  options: InsightsPromptOptions
): string {
  const outputLanguage = language === 'en' ? 'English' : 'español';
  const lang = language === 'en' ? 'en' : 'es';
  const groupByFraming = GROUPBY_FRAMING[options.groupBy][lang];

  const smallSampleRule = options.smallSample
    ? language === 'en'
      ? '\n7. This period has a SMALL SAMPLE of events. Do not inflate a single isolated case or outlier into a "trend" or "recurring pattern" — describe it explicitly as an isolated/atypical case and avoid claims about sustained behavior the data cannot support.'
      : '\n7. Este periodo tiene una MUESTRA CHICA de eventos. No conviertas un caso aislado o un outlier en una "tendencia" o "patrón recurrente" — descríbelo explícitamente como caso atípico/aislado y evita afirmaciones sobre comportamiento sostenido que los datos no puedan sostener.'
    : '';

  return `Eres un analista de datos de manufactura especializado en sistemas Andon (seguimiento de paros de línea).

Contexto del dominio:
- Un "evento" es un paro de línea: un operario presiona un botón de la botonera para pedir ayuda de un departamento (Mantenimiento, Ingeniería, Materiales, Calidad).
- Cada evento pasa por tramos: atención (desde que se abre hasta que alguien lo atiende) y solución (desde que se atiende hasta que se cierra).
- Si un evento tarda demasiado sin atenderse, el sistema escala: primero a una alerta visual/mensaje ("alert"), y si sigue sin resolverse, a niveles de escalamiento superiores (nivel 2, nivel 3) que notifican a más gente.
- Existen paros programados (comida, cambios de turno, mantenimiento preventivo) que se descuentan del tiempo de paro real: "totalDowntimeMinutesExcludingScheduled" es la cifra honesta de paro NO programado.
- Recibirás un resumen agregado en JSON de un periodo. NO son eventos individuales, son totales y promedios ya calculados, incluyendo "byPeriod": una serie de buckets a nivel ${GROUPBY_NAME[options.groupBy]} (día/semana/mes) con eventCount/totalMinutes/avgMinutes/escalatedToAlertPct por bucket.

Tu tarea: identificar hasta 5 patrones de alto valor en los datos agregados y priorizarlos por impacto para el equipo de planta.

Nivel de agrupación de este análisis: "${options.groupBy}". ${groupByFraming} Si "byPeriod" tiene 2 o más buckets, apóyate en su evolución para que el hallazgo refleje realmente ese nivel de agrupación — es la única forma de que cambiar entre Día/Semana/Mes produzca una salida distinta para los mismos datos. Si "byPeriod" tiene menos de 2 buckets, no hay nada que comparar en el tiempo: enfócate en los demás bloques (byAreaDepartment, topSignalsByDuration, byReason, byHourOfDay/byDayOfWeek) en vez de forzar una comparación temporal que los datos no soportan.

Responde ÚNICAMENTE con un array JSON, sin markdown, sin fences, sin preámbulo ni texto fuera del array. Cada elemento del array debe tener EXACTAMENTE esta forma:

[
  {
    "title": "string — titular corto y accionable",
    "description": "string — 1-2 frases explicando el hallazgo",
    "severity": "info" | "warning" | "critical",
    "category": "departamento" | "area" | "señal" | "motivo" | "horario" | "escalamiento",
    "supportMetricLabel": "string — qué mide, ej. 'Duración promedio en turno noche'",
    "supportMetricValue": "string — el valor tal como aparece en el payload, ej. '42 min'",
    "supportComparison": "string opcional — ej. '3.1x vs promedio general'",
    "relatedAreaId": number opcional — SOLO si el hallazgo referencia un área presente en byAreaDepartment o topSignalsByDuration,
    "relatedDepartmentId": number opcional — SOLO si referencia un departamento presente en el payload,
    "relatedSignalId": number opcional — SOLO si referencia una señal presente en topSignalsByDuration
  }
]

Reglas duras (no negociables):
1. Máximo 5 hallazgos, ordenados por impacto (el más importante primero).
2. NO inventes números. Usa solo cifras que aparecen literalmente en el payload que recibes. El backend va a re-verificar cada cifra contra el payload y descartará cualquier hallazgo que no cuadre.
3. Cada hallazgo debe citar un relatedAreaId/relatedDepartmentId/relatedSignalId cuando el hallazgo se refiera a una entidad específica del payload (usa el id EXACTO que aparece ahí, no lo inventes).
4. Redacta título y descripción en ${outputLanguage}.
5. Si no hay patrones relevantes o el periodo tiene muy pocos datos para concluir algo útil, devuelve un array vacío: []. No fuerces hallazgos débiles solo por completar 5.
6. No repitas el mismo hallazgo con distinta redacción.${smallSampleRule}

Ejemplo de salida bien formada (few-shot, no lo copies literalmente — usa los datos reales del payload):
[
  {
    "title": "Mantenimiento tarda 3x más en Línea 4 en turno de noche",
    "description": "Los eventos de Mantenimiento en Línea 4 entre las 22:00 y 06:00 tienen una duración promedio muy superior al resto del día, sugiriendo falta de personal o repuestos disponibles en ese turno.",
    "severity": "warning",
    "category": "horario",
    "supportMetricLabel": "Duración promedio en turno noche",
    "supportMetricValue": "42 min",
    "supportComparison": "3.1x vs promedio general",
    "relatedAreaId": 4,
    "relatedDepartmentId": 2
  }
]`;
}

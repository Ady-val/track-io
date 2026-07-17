# BUILD SPEC — Fase 2: Dashboard de paros, trazabilidad y Excel (TrackIQ)

> **Para:** Claude Code, en el checkout local de `https://github.com/Ady-val/track-io.git`.
> **Revisión 2.** Incorpora: la columna `response_discount_seconds`, la resolución de la deuda del
> `/recalculate`, y la **trazabilidad completa por evento** (de qué hora a qué hora influyó cada
> paro programado). Esta última **enmienda una decisión de la Fase 1** — ver §2.
>
> **Depende de la Fase 1** (`CLAUDE_CODE_BUILD_SPEC_FASE1.md`), que debe construirse **con el
> parche `PATCH_FASE1_ANTES_DE_CONSTRUIR.md` ya aplicado**. Ese parche elimina de la Fase 1 la
> columna `events.scheduled_downtime_snapshot`, que esta fase sustituye por una tabla. Si la Fase 1
> ya se construyó sin el parche, aplica el parche y regenera antes de seguir.
>
> **Naturaleza de este documento.** A diferencia del spec de Fase 1 —que contenía código ya
> ejecutado y verificado— este es un **spec de diseño**: define contratos, fórmulas y trampas, pero
> el código lo escribes tú. Verifica cada supuesto contra el repo real antes de asumirlo.
> **[VERIFICADO]** = comprobado contra la base de código. **[DISEÑO]** = decisión a implementar.

---

## 0. Qué se construye

1. **Trazabilidad total del evento** (§2, §4). Cada evento debe poder responder, sin ambigüedad:
   cuándo empezó, cuándo lo atendieron, cuándo se cerró, cuánto duró en total, cuánto de ese tiempo
   era paro programado, **de qué hora a qué hora ocurrió ese paro programado y cuál fue**, y cuánto
   duró realmente descontándolo.
2. **Dashboard de paros** (§5, §8). Rango libre (un día, varios días, meses) y área. Muestra paro
   programado y no programado **juntos**, para que la resta se vea y se compruebe.
3. **Exportación a Excel** (§7). Los mismos datos, auditables a mano.
4. **`POST /scheduled-downtimes/recalculate`** (§6). La deuda de la Fase 1, ahora obligatoria.

### 0.1 La fórmula que ancla todo

```
Tiempo calendario
  − Paro programado (comidas, fuera de horario, cambio de turno)
  = Tiempo productivo planeado
      − Paro no programado (lo que mide el Andon)
      = Tiempo corriendo

Disponibilidad = Tiempo corriendo ÷ Tiempo productivo planeado
```

Los paros programados de la Fase 1 **son** la "pérdida por programación" del estándar de industria.
La Fase 1 construyó el denominador de la métrica que persigue toda planta.

### 0.2 Tres honestidades que deben quedar en el producto

1. **Esto NO es OEE.** OEE = Disponibilidad × Rendimiento × Calidad. TrackIQ no cuenta piezas ni
   scrap. Solo calculamos **Disponibilidad**. **La palabra "OEE" no debe aparecer en ningún texto de
   UI, endpoint, hoja de Excel ni nombre de variable.**
2. **El Andon solo mide el paro que alguien reportó.** Si la línea está parada y nadie presiona el
   botón, para el sistema está produciendo. Nuestra disponibilidad es un **techo optimista**. La UI
   debe decirlo (§8.6).
3. **Sin paros programados configurados, la disponibilidad es basura.** Sin ventanas de "fuera de
   horario" el denominador serán 24 h/día. La UI debe advertirlo de forma prominente (§8.6).

---

## 1. Lo que ya existe [VERIFICADO]

No agregues dependencias que ya están, ni reinventes patrones.

| Cosa | Estado | Dónde |
|---|---|---|
| **Chart.js 4.5 + react-chartjs-2 5.3** | **Ya instalados y en uso** | `dashboard-test/package.json`; ejemplos en `src/components/molecules/`: `RealtimeGroupChart.tsx`, `LevelChart.tsx`, `VibrationLineChart.tsx`, `GaugeChart.tsx`, `DewPointDonutChart.tsx` |
| `chartjs-plugin-annotation`, `chartjs-adapter-dayjs-4`, `dayjs` | Ya instalados | idem |
| Librería de Excel | **NO existe** → única dependencia nueva de esta fase (`exceljs`) | §7 |
| `ScheduledDowntimeCalculatorService` | Fase 1 | `src/scheduled-downtimes/application/services/` |
| Caché del catálogo | Fase 1. TTL 30 s + invalidación en el CRUD | `scheduled-downtime-cache.service.ts` |
| Columnas de Fase 1 | `duration_seconds`, `scheduled_downtime_discount_seconds`, `effective_duration_seconds`, `scheduled_downtime_snapshot` | `events`, `area_downtimes` |
| Índices de Fase 1 | `events (area_id, closed_at)`, `area_downtimes (area_id, ends_at)` | necesarios aquí |
| Campos de `events` | `area_id`, `area_name`, `department_id`, `department_name`, `device_id`, `device_signal_id`, `created_at`, **`in_progress_at`**, `closed_at`, `duration_seconds`, `virtual_device`, `reason`, `comment` | `event.entity.ts` |
| Ciclo de 3 pulsaciones | `OPEN` → `IN_PROGRESS` → `CLOSED`. **Un evento cerrado siempre pasó por `IN_PROGRESS`** | `signal.service.ts` → `handleEventLogic` |
| Patrón de módulo NestJS | `domain/entities`, `domain/repositories`, `application/dtos`, `application/services`, `controllers`, `<x>.module.ts` | usa `departments/` como plantilla |
| `exactOptionalPropertyTypes: true` | Activo. `unknown` incluye `undefined` y TypeORM lo rechaza; usa `object \| null` | `tsconfig.json` |
| Línea base de `tsc` | **143 errores preexistentes**, todos en `.spec.ts`. Tu código debe aportar **0** | |

**Sobre `in_progress_at`:** el sistema lleva guardando este dato desde siempre y **ningún reporte lo
usa**. Parte el paro en dos tiempos que la industria mide por separado:

- **Tiempo de atención** = `in_progress_at − created_at` → cuánto tardaron en llegar.
- **Tiempo de solución** = `closed_at − in_progress_at` → cuánto tardaron en arreglarlo (MTTR).

> **Supuesto a validar con el cliente:** asume que el técnico presiona el botón **al llegar**. Si la
> segunda pulsación significa otra cosa, la métrica de atención es ruido.

---

## 2. Enmienda a la Fase 1: el snapshot pasa a ser una tabla [DISEÑO]

**Lee esto antes que nada. Cambia código de la Fase 1.**

### 2.1 Por qué cambia

El negocio exige que cada evento diga **de qué hora a qué hora** influyó cada paro programado, y que
ese histórico sea **consultable**. El diseño de Fase 1 no lo permite:

| Problema del `jsonb` de Fase 1 | Consecuencia |
|---|---|
| Guarda la ventana **configurada** (`"12:00"`–`"13:00"`), no las **ocurrencias reales** con fecha | No puede responder "de qué hora a qué hora" |
| Colapsa varias ocurrencias en un solo total | Un evento que cruza dos días pierde que fueron **dos** comidas distintas |
| Es un blob | "¿Cuánto tiempo nos costó la comida este mes?" no se consulta bien en SQL |
| Con paros traslapados, `Σ items ≠ total` | Los números **no cuadran** y no son auditables (§2.3) |

**Decisión:** sustituir `events.scheduled_downtime_snapshot` (jsonb) por una **tabla normalizada con
valores congelados**. Congelada = copia el nombre y la ventana tal como estaban al cerrar, y **sin FK
al catálogo** (la fila del catálogo puede borrarse; el histórico no debe romperse ni cambiar). Se
conserva así la razón de ser del snapshot de Fase 1, y además se gana consultabilidad y detalle
horario.

`area_downtimes.scheduled_downtime_snapshot` (jsonb) **se queda como está**. Es auditoría del número
de disponibilidad, no la unidad de transparencia que el negocio pidió. No inventes una segunda tabla
para él.

### 2.2 Estado confirmado: la Fase 1 no está desplegada

**Confirmado con el cliente: la Fase 1 aún no está en producción.** Por lo tanto:

- La Fase 1 se construye con `PATCH_FASE1_ANTES_DE_CONSTRUIR.md` aplicado: **nunca llega a existir**
  la columna `events.scheduled_downtime_snapshot`.
- **No hay histórico que migrar.** Esta fase crea la tabla de rebanadas y punto.
- `area_downtimes.scheduled_downtime_snapshot` (jsonb) **sí existe y se queda**: es auditoría del
  número de disponibilidad, no la unidad de transparencia que pidió el negocio. No inventes una
  segunda tabla para él.

Antes de empezar, **verifica** que la columna no exista:

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'events' AND column_name = 'scheduled_downtime_snapshot';
-- Debe devolver 0 filas. Si devuelve 1, la Fase 1 se construyó sin el parche:
-- aplica el parche, elimina la columna en tu migración y usa el /recalculate de §6
-- para regenerar las rebanadas del histórico ya escrito.
```

### 2.3 El reparto disjunto (la trampa fina)

El calculador de Fase 1 hace un *merge* de intervalos solapados para no descontar dos veces. Eso está
bien para el **total**, pero rompe la atribución:

```
Comida 12:00–13:00  →  60 min
Junta  12:30–14:00  →  90 min
Σ por paro = 150 min                      ✗
Total real (unión 12:00–14:00) = 120 min  ✓
```

Si guardas las ocurrencias crudas, `Σ ocurrencias ≠ total` y el usuario que sume la tabla no va a
cuadrar con el KPI. **Inaceptable para un requisito de transparencia.**

**Regla:** cada segundo de descuento se atribuye a **exactamente un** paro programado. El calculador
debe producir **rebanadas disjuntas** mediante un barrido:

1. Genera los intervalos candidatos por paro programado (como hoy).
2. Ordena por inicio; desempata por `scheduledDowntimeId` ascendente (**determinista**).
3. Recorre en orden; cuando un intervalo se traslapa con lo ya cubierto, **recórtalo** y quédate solo
   con la parte no cubierta.
4. Resultado: rebanadas disjuntas.

Con el ejemplo: `Comida 12:00–13:00` (60 min) + `Junta 13:00–14:00` (60 min) = **120 min**, igual al
total. Cada segundo tiene un dueño único.

> El **total no cambia** respecto a la Fase 1 (sigue siendo la unión, sin doble conteo). Lo único que
> cambia es que ahora está descompuesto de forma exacta y auditable. El test 7 de la Fase 1 (dos
> paros traslapados → 120 min) debe seguir pasando igual.

### 2.4 Nueva API del calculador

```ts
export interface ScheduledDowntimeSlice {
  scheduledDowntimeId: number;
  name: string;                 // congelado
  configuredStartTime: string;  // 'HH:mm' congelado
  configuredEndTime: string;    // 'HH:mm' congelado
  from: Date;                   // instante absoluto — el "de qué hora"
  to: Date;                     // instante absoluto — el "a qué hora"
  seconds: number;
}

export interface ScheduledDowntimeDiscount {
  timezone: string;                    // con qué zona se resolvió
  totalDiscountedSeconds: number;      // === Σ slices.seconds  (invariante, §9.1)
  slices: ScheduledDowntimeSlice[];    // DISJUNTAS (§2.3), ordenadas por `from`
}

// Sustituye a getDiscountSnapshot(). Mantén getDiscountedSeconds() y getEffectiveSeconds()
// tal cual: los usan el cron de escalamiento y el dashboard, y no necesitan el detalle.
getDiscount(areaId: number, from: Date, to: Date): Promise<ScheduledDowntimeDiscount>
```

**Invariante que debes probar:** `totalDiscountedSeconds === Σ slices.seconds`, **siempre**, incluso
con paros traslapados. Y `getDiscountedSeconds()` debe devolver exactamente lo mismo que
`getDiscount().totalDiscountedSeconds` — no dupliques la lógica: que uno llame al otro.

---

## 3. Las cinco trampas del dashboard [DISEÑO]

Cuatro de las cinco producen números que **parecen correctos y están mal**.

### Trampa 1 — El paro programado del KPI NO es la suma de los descuentos de los eventos

**La más importante.**

```ts
// ❌ MAL — subestima gravemente
scheduledSeconds = SUM(area_downtimes.scheduled_downtime_discount_seconds)

// ✅ BIEN
scheduledSeconds = await calculator.getDiscountedSeconds(areaId, from, to)
```

**Por qué:** el descuento guardado solo contiene el paro programado **que se traslapó con un paro
real**. La comida de un día en que la línea no se detuvo no está en ningún registro de evento, pero
**sí es tiempo programado** y **sí va en el denominador**.

Las rebanadas (§2) explican un evento concreto. El KPI y el denominador se calculan con el calculador
sobre **el rango completo**.

### Trampa 2 — Recorte en los bordes del rango

Un `area_downtime` que empezó el 30 de junio y cerró el 1 de julio no puede sumarse completo a
"junio".

```
Downtimes CONTENIDOS en [from, to] y cerrados:  SUM(effective_duration_seconds)  ← precalculado
Downtimes que CRUZAN un borde, o activos:       recalcular recortados            ← ≤ 2 por área

  clippedStart = max(start_at, from)
  clippedEnd   = min(ends_at ?? now, to)
  rawClipped       = clippedEnd − clippedStart
  discountClipped  = await calculator.getDiscountedSeconds(areaId, clippedStart, clippedEnd)
  effectiveClipped = max(0, rawClipped − discountClipped)
```

### Trampa 3 — Los downtimes abiertos también cuentan

Un `area_downtime` con `is_active = true` es una línea **parada ahora mismo**. Si el rango incluye el
presente y lo ignoras, "hoy" siempre se verá mejor que la realidad. Inclúyelo recortado a
`min(now, to)`, por la vía de recálculo de la Trampa 2. Es como máximo **uno por área**.

### Trampa 4 — Agrupar por día en zona de planta, no en UTC

```sql
-- ❌ MAL: el turno nocturno cae en el día equivocado
date_trunc('day', closed_at)
-- ✅ BIEN
date_trunc('day', closed_at AT TIME ZONE :plantTimezone)
```

`:plantTimezone` viene de `PLANT_TIMEZONE` (config `plant.timezone` de la Fase 1). Un paro a las 23:00
hora de planta es del lunes aunque en UTC ya sea martes.

### Trampa 5 — Nunca promediar porcentajes

```ts
// ❌ MAL
availability = avg(areas.map(a => a.availability))
// ✅ BIEN — ponderado
availability = SUM(areas.runSeconds) / SUM(areas.plannedProductionSeconds)
```

---

## 4. Modelo de datos [DISEÑO]

### 4.1 Columna nueva en `events`

| Columna | Tipo | Para qué |
|---|---|---|
| `response_discount_seconds` | `integer NULL` | Paro programado que cayó dentro del tramo de **atención** (`created_at` → `in_progress_at`) |

**Por qué hace falta.** Si la línea cae a las 12:40, la comida es 13:00–14:00 y el técnico llega a
las 14:10, el tiempo de atención de reloj son 90 min pero solo 30 son productivos. Sin esta columna
el dashboard acusaría a Mantenimiento de tardar 90 minutos en llegar cuando 60 fueron la comida — **y
contradiría al escalamiento**, que desde la Fase 1 (D1) cuenta minutos productivos y no habría
escalado hasta las 14:10. Los dos números tienen que decir lo mismo.

**Por qué solo una columna.** Los tramos `[created, in_progress)` y `[in_progress, closed)` son
**contiguos y disjuntos**, y su unión es `[created, closed)`. Por lo tanto
`discount(total) = discount(atención) + discount(solución)` y todo lo demás se deriva:

```ts
responseSeconds            = in_progress_at − created_at                  // derivado, gratis
effectiveResponseSeconds   = responseSeconds − response_discount_seconds
resolutionSeconds          = closed_at − in_progress_at                   // derivado, gratis
effectiveResolutionSeconds = resolutionSeconds
                             − (scheduled_downtime_discount_seconds − response_discount_seconds)
```

### 4.2 Tabla nueva `event_scheduled_downtime_slices`

Es **el registro de transparencia** que pidió el negocio.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | |
| `event_id` | `integer NOT NULL` | FK lógica a `events.id` (el repo no declara FK DDL; se valida en el Service) |
| `scheduled_downtime_id` | `integer NOT NULL` | **Informativo. Sin constraint FK**: la fila del catálogo puede borrarse y el histórico no debe romperse |
| `name` | `varchar(255) NOT NULL` | **Congelado** al cerrar. Si renombran "Comida" → "Lunch", el histórico sigue diciendo "Comida" |
| `configured_start_time` | `time NOT NULL` | Congelado |
| `configured_end_time` | `time NOT NULL` | Congelado |
| `occurred_from` | `timestamptz NOT NULL` | **El "de qué hora"** |
| `occurred_to` | `timestamptz NOT NULL` | **El "a qué hora"** |
| `seconds` | `integer NOT NULL` | `occurred_to − occurred_from` |
| `segment` | `varchar(20) NOT NULL` | `'response'` \| `'resolution'` |
| `timezone` | `varchar(64) NOT NULL` | Zona con que se resolvió, para auditar cálculos viejos |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |

Índices: `(event_id)`, `(occurred_from)`, `(scheduled_downtime_id)`.

**Invariantes (pruébalos, §9.1):**

```
Σ seconds WHERE event_id = X                        === events.scheduled_downtime_discount_seconds
Σ seconds WHERE event_id = X AND segment='response' === events.response_discount_seconds
Las rebanadas de un mismo evento NO se traslapan entre sí (§2.3)
```

El campo `segment` hace que `response_discount_seconds` sea **derivable y auditable**: la columna
está denormalizada solo para que el dashboard agregue rápido sin join, pero la verdad está en las
rebanadas. Si divergen, hay un bug.

Con esto, un evento responde por sí solo:

> *Empezó 11:30. Atendido 12:15. Cerrado 13:30. Duró 2 h. De esas, 1 h fue paro programado ("Comida",
> configurada 12:00–13:00, ocurrida el 13/jul de 12:00 a 13:00 hora de planta, durante el tramo de
> solución). Duración real: 1 h. Atención: 45 min de reloj, 15 min productivos.*

Y responde consultas: `SELECT name, SUM(seconds) FROM event_scheduled_downtime_slices … GROUP BY name`.

### 4.3 Cambio en `SignalService.closeEvent()`

Tras Fase 1 hace **una** llamada al calculador sobre `[created_at, closedAt]`. Pasa a hacer **dos**,
sobre los dos tramos, y a persistir las rebanadas:

```ts
const r = await safeDiscount(event.areaId, event.createdAt, event.inProgressAt);   // atención
const s = await safeDiscount(event.areaId, event.inProgressAt, closedAt);          // solución
const discountTotal = r.totalDiscountedSeconds + s.totalDiscountedSeconds;  // exacto: disjuntos

// events:
//   scheduled_downtime_discount_seconds = discountTotal
//   response_discount_seconds           = r.totalDiscountedSeconds
//   effective_duration_seconds          = max(0, durationSeconds − discountTotal)
// event_scheduled_downtime_slices: INSERT de r.slices (segment='response')
//                                       y de s.slices (segment='resolution')
```

Mantén la **degradación segura** de la Fase 1 (§1.6.3): si el cálculo falla, el evento **se cierra
igual** con descuento 0 y sin rebanadas. El cierre del Andon sigue siendo sagrado. El cierre no es
camino caliente (ritmo humano) y el catálogo está cacheado: la segunda llamada no cuesta nada
medible.

Escribe evento y rebanadas **en la misma transacción**: un evento con descuento pero sin rebanadas
rompe el invariante de §4.2.

> **Caso borde:** si `in_progress_at` fuera null en un evento que se cierra (no debería pasar con el
> ciclo de 3 pulsaciones, pero defiéndete), atribuye todo a `resolution` y deja
> `response_discount_seconds = NULL`. Los reportes deben **excluir** de las medias los eventos con
> `in_progress_at` null, no contarlos como 0.

### 4.4 Migración

`<timestamp>-AddEventSliceTraceability.ts`

- `ALTER TABLE events ADD COLUMN response_discount_seconds integer;`
- `CREATE TABLE event_scheduled_downtime_slices (...)` + los 3 índices.
- Seed idempotente de los 4 permisos del módulo `reports` (§5.1) con `ON CONFLICT DO NOTHING`, igual
  que `SeedInitialData1000000000001`.
- Backfill: `UPDATE events SET response_discount_seconds = 0 WHERE status = 'closed';`
- `down()` simétrico.

> **Sobre el backfill:** `0` significa "todo el descuento fue del tramo de solución". Es correcto para
> lo cerrado **antes** de la Fase 1 (no había paros programados; el descuento real es 0). Para lo
> cerrado **entre** el despliegue de Fase 1 y el de Fase 2 sería una atribución errónea, acotada a esa
> ventana — y corregible con el `/recalculate` de §6. **Si Fase 1 y Fase 2 se despliegan juntas, la
> ventana está vacía.**

### 4.5 Índices

La Fase 1 ya creó `events (area_id, closed_at)` y `area_downtimes (area_id, ends_at)`, que es lo que
estas consultas necesitan. **Antes de agregar más, mide con `EXPLAIN ANALYZE`** sobre un rango de un
mes con datos reales. No agregues índices por si acaso.

---

## 5. Backend — módulo `reports` [DISEÑO]

### 5.1 Estructura

```
backend-receptor/src/reports/
├── application/
│   ├── dtos/downtime-report.dto.ts
│   └── services/
│       ├── downtime-report.service.ts          ← agregación (el corazón)
│       ├── downtime-report.service.spec.ts
│       └── downtime-report-excel.service.ts
├── controllers/downtime-report.controller.ts
└── reports.module.ts
```

Sin entidad propia: lee de `events`, `event_scheduled_downtime_slices` y `area_downtimes`. Importa
`ScheduledDowntimesModule` (ya exporta el calculador) y los repositorios que necesites.

Permisos: módulo nuevo `REPORTS = 'reports'` en el enum `Module` de `permissions.constants.ts` y su
espejo en `dashboard-test/src/constants/permissions.ts`. Guardas `JwtAuthGuard` + `PermissionGuard`,
y `@SystemModuleTag(SystemModule.SIGNALS)`.

### 5.2 `GET /reports/downtime` — alimenta toda la pantalla

**Un solo endpoint.** Una ida y vuelta, y todos los bloques consistentes entre sí (con 3 endpoints
podrían responder con datos de instantes distintos).

```
GET /reports/downtime
  ?areaId=3            (opcional; ausente = todas las áreas)
  &from=2026-07-13T00:00:00-06:00     (ISO 8601 con offset explícito, obligatorio)
  &to=2026-07-19T23:59:59-06:00       (obligatorio)
  &groupBy=day                         (day | week | month; default: day)
```

Validaciones: `from`/`to` obligatorios y parseables; `to > from`; rango máximo **370 días** (400 si se
excede — evita que alguien pida 10 años y tumbe el servidor); `areaId` existente.

**Todos los tiempos en segundos enteros.** El formateo a `Xh Ym` es de la UI.

```ts
{
  message: string;
  data: {
    range: { from: string; to: string; timezone: string; groupBy: 'day'|'week'|'month' };
    scope: { areaId: number | null; areaName: string | null };

    summary: {
      calendarSeconds: number;
      scheduledDowntimeSeconds: number;      // ← calculador sobre el rango (Trampa 1)
      plannedProductionSeconds: number;      // calendar − scheduled
      unplannedDowntimeSeconds: number;      // Σ effective de area_downtimes (Trampas 2 y 3)
      runSeconds: number;                    // plannedProduction − unplanned
      availability: number | null;           // run / plannedProduction; null si denominador 0
      eventCount: number;
      avgResponseSeconds: number | null;     // media de los EFECTIVOS
      avgResolutionSeconds: number | null;
      hasScheduledDowntimeConfigured: boolean;  // ← para la advertencia de §8.6
    };

    byDepartment: Array<{
      departmentId: number; departmentName: string;
      unplannedDowntimeSeconds: number;      // Σ effective_duration_seconds de events
      eventCount: number;
      avgResponseSeconds: number | null;
      avgResolutionSeconds: number | null;
      cumulativePercent: number;             // Pareto, orden desc
    }>;

    trend: Array<{
      bucket: string;                        // 'YYYY-MM-DD' (día/semana) | 'YYYY-MM' (mes)
      scheduledDowntimeSeconds: number;
      unplannedDowntimeSeconds: number;
      plannedProductionSeconds: number;
      runSeconds: number;
      availability: number | null;
    }>;
  }
}
```

### 5.3 Fórmulas exactas del `summary`

```ts
calendarSeconds = (to − from) en segundos × (nº de áreas del scope)

scheduledDowntimeSeconds = Σ_areas calculator.getDiscountedSeconds(areaId, from, to)   // Trampa 1

plannedProductionSeconds = max(0, calendarSeconds − scheduledDowntimeSeconds)

unplannedDowntimeSeconds = Σ area_downtimes:
    · contenidos en [from,to] y cerrados  → effective_duration_seconds
    · que cruzan un borde, o activos      → recálculo recortado (Trampas 2 y 3)

runSeconds = max(0, plannedProductionSeconds − unplannedDowntimeSeconds)

availability = plannedProductionSeconds > 0 ? runSeconds / plannedProductionSeconds : null
```

**Caso borde obligatorio:** si el rango entero es paro programado (p. ej. piden un domingo y la línea
no opera domingos), `plannedProductionSeconds = 0` y **la disponibilidad no está definida**. Devuelve
`null` y que la UI muestre `—`. Devolver `0%` sería mentir: la línea no falló, no estaba programada
para producir.

**`byDepartment` sale de `events`; `summary.unplannedDowntimeSeconds` sale de `area_downtimes`.** Por
eso **`Σ byDepartment ≥ summary.unplannedDowntimeSeconds`**: si dos departamentos tuvieron llamadas
simultáneas en la misma línea, la línea se detuvo una vez pero ambos son responsables. **No es un
bug** — y la UI no debe presentarlos como si tuvieran que cuadrar (§8.5).

### 5.4 Cálculo del `trend`

Por cada bucket (día/semana/mes, **en zona de planta**) y cada área del scope:

- `scheduledDowntimeSeconds` = `calculator.getDiscountedSeconds(areaId, bucketStart, bucketEnd)`
- `unplannedDowntimeSeconds` = misma lógica de recorte del summary, acotada al bucket
- el resto con las fórmulas de §5.3

**Coste:** un mes con `groupBy=day` y 5 áreas = 150 llamadas al calculador. Con el catálogo cacheado
son cálculos en memoria, sin BD. **Pero mídelo:** si 370 días × `day` × 20 áreas (7 400 llamadas)
tarda demasiado, restringe `groupBy=day` a rangos ≤ 92 días y fuerza `week`/`month` por encima.

Los buckets **se generan aunque no tengan eventos** (un día sin paros es un dato: disponibilidad
100%). No los omitas o la gráfica mentirá por ausencia.

### 5.5 Medias de atención y solución

- Sobre los tiempos **efectivos** (§4.1), no los de reloj.
- **Excluye** los eventos con `in_progress_at` null. No los cuentes como 0.
- Sin eventos válidos → `null`, no `0`.
- Media aritmética (MTTR, el estándar de industria).

> **Advertencia a transmitir al cliente:** la media es sensible a extremos. Un paro de 8 h entre 40 de
> 5 min dispara el MTTR y hace ver mal a un departamento que normalmente responde bien. Si el cliente
> empieza a discutir el número, la respuesta es **agregar mediana y p95**, no cambiar la media. No lo
> implementes ahora, pero tenlo previsto.

### 5.6 `GET /reports/events` — la trazabilidad, lista por lista

Alimenta la tabla de eventos de §8.7. Es donde el requisito de transparencia se hace visible.

```
GET /reports/events?areaId=&from=&to=&departmentId=&limit=50&offset=0
```

`limit` máximo 100.

```ts
{
  message: string;
  data: Array<{
    id: number;
    areaName: string;
    departmentName: string;
    createdAt: string;              // cuándo empezó
    inProgressAt: string | null;    // cuándo lo atendieron
    closedAt: string | null;        // cuándo se cerró
    durationSeconds: number | null;                  // cuánto duró en total
    scheduledDowntimeDiscountSeconds: number | null; // cuánto de eso era paro programado
    effectiveDurationSeconds: number | null;         // cuánto duró realmente
    responseSeconds: number | null;                  // derivado
    effectiveResponseSeconds: number | null;         // derivado
    resolutionSeconds: number | null;                // derivado
    effectiveResolutionSeconds: number | null;       // derivado
    virtualDevice: boolean;
    reason: string | null;
    comment: string | null;
    scheduledDowntimeSlices: Array<{      // ← el "de qué hora a qué hora"
      name: string;
      configuredStartTime: string;
      configuredEndTime: string;
      occurredFrom: string;
      occurredTo: string;
      seconds: number;
      segment: 'response' | 'resolution';
    }>;
  }>;
  total: number;
  pagination: { limit: number; offset: number; total: number };
}
```

Las rebanadas vienen embebidas: la mayoría de los eventos tienen 0 y ninguno tendrá muchas. Trae las
rebanadas de la página en **una sola consulta** (`WHERE event_id IN (...)`), no una por evento — no
hagas N+1.

---

## 6. `POST /scheduled-downtimes/recalculate` [DISEÑO]

Deuda de la Fase 1, ahora obligatoria: con el dashboard encima, cualquier error de configuración de
horarios se vuelve visible en los históricos, y los datos están **congelados por diseño**. Sin esto,
la única salida sería tocar la BD a mano.

Vive en el módulo `scheduled-downtimes` (es sobre paros programados), no en `reports`.

```
POST /scheduled-downtimes/recalculate
Body: { areaId?: number; from: string; to: string; dryRun?: boolean }   // dryRun default: true
Permiso: scheduled-downtimes:update
```

Comportamiento:

- Recalcula, con el catálogo **actual**, los `events` **cerrados** y los `area_downtimes` **cerrados**
  cuyo intervalo intersecta `[from, to]`.
- Por evento: recalcula los dos tramos (§4.3), reescribe `scheduled_downtime_discount_seconds`,
  `response_discount_seconds` y `effective_duration_seconds`, y **borra e reinserta** sus rebanadas —
  en una transacción por lote.
- Por `area_downtime`: recalcula descuento, efectivo y su snapshot jsonb.
- **`dryRun: true` (default)** devuelve cuántas filas cambiarían y el delta agregado en segundos,
  **sin escribir nada**. Que lo destructivo sea opt-in explícito, no el default.
- Procesa **por lotes** (`limit`/`offset`, p. ej. 500) para no cargar meses en memoria.
- Registra en log cuántas filas tocó y el delta total.
- **Nunca toca `duration_seconds`, `created_at`, `in_progress_at` ni `closed_at`** (hechos medidos),
  ni filas abiertas.

```ts
// Respuesta
{
  message: string;
  data: {
    dryRun: boolean;
    eventsAffected: number;
    areaDowntimesAffected: number;
    discountDeltaSeconds: number;    // + = ahora se descuenta más que antes
    effectiveDeltaSeconds: number;
  }
}
```

Es también la red de seguridad si algún día se descubre que un horario estuvo mal configurado
durante semanas: sin esto, la única salida sería reescribir la base de datos a mano.

---

## 7. Exportación a Excel [DISEÑO]

### 7.1 Dependencia y endpoint

`exceljs` en `backend-receptor`. **Única dependencia nueva de esta fase.** Generación en **backend**,
no en frontend: los datos ya están ahí y no tiene sentido mandar 50 000 filas al navegador para que
arme el archivo.

```
GET /reports/downtime/export?areaId=&from=&to=&groupBy=
→ Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
→ Content-Disposition: attachment; filename="paros_<area>_<from>_<to>.xlsx"
```

Mismos parámetros y validaciones que §5.2 (reutiliza el DTO). Permiso `reports:read`.

Para rangos grandes usa el **streaming writer**
(`new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res })`) y pagina la lectura: un mes de 5 líneas
pueden ser decenas de miles de filas y cargarlas todas en memoria tumba el proceso.

### 7.2 Las tres hojas

**Hoja 1 — `Resumen`.** Una fila por área (más total si el scope es "todas"). **Debe permitir rehacer
la resta a mano:**

| Área | Tiempo calendario | Paro programado | Tiempo productivo planeado | Paro no programado | Tiempo corriendo | Disponibilidad | Nº paros | Atención prom. | Solución prom. |

Encabezado con: rango consultado, zona horaria de planta, fecha de generación, y la nota de que **el
sistema solo mide el paro reportado por el Andon** (§0.2.2).

**Hoja 2 — `Eventos`.** Una fila por evento cerrado del rango. **Es el requisito explícito del
negocio: todos los tiempos visibles y juntos.**

| Área | Departamento | Inicio | Atendido | Cierre | Duración (s) | Paro programado en el evento (s) | Duración efectiva (s) | Atención (s) | Atención efectiva (s) | Solución (s) | Solución efectiva (s) | Origen | Motivo | Comentario |

`Origen` = físico/virtual (`virtual_device`). `Motivo`/`Comentario` de `reason`/`comment` (hoy solo
los llena la botonera virtual; se enriquecen en Fase 3).

Formatea en **segundos enteros**. Puedes agregar columnas gemelas en minutos si el cliente lo
prefiere, pero **no sustituyas** segundos por minutos: el redondeo rompe la comprobación de la resta.

**Hoja 3 — `Paros programados aplicados`.** Un renglón por **rebanada** (§4.2). Aquí vive el "de qué
hora a qué hora":

| Evento ID | Área | Paro programado | Ventana configurada | Ocurrió desde | Ocurrió hasta | Segundos | Tramo |

`Ocurrió desde/hasta` en **hora de planta** (no UTC) — es lo que el usuario reconoce. `Tramo` =
atención/solución. Usa el `name` **congelado de la rebanada**, no el del catálogo actual: si
renombraron "Comida" a "Lunch" el mes pasado, el histórico debe seguir diciendo "Comida". Esa es toda
la razón de ser del congelado (§4.2).

Con estas tres hojas el cliente audita la cadena completa: hoja 3 explica el descuento hora por hora,
hoja 2 lo aplica evento por evento, hoja 1 lo agrega. Es la defensa contra el vicio más común del
sector: inflar la disponibilidad reclasificando pérdidas como "programadas".

---

## 8. Frontend [DISEÑO]

### 8.1 Archivos

```
dashboard-test/src/
├── pages/ReportsPage.tsx
├── types/report.ts                       ← espejo de §5.2 y §5.6
├── hooks/useDowntimeReport.ts            ← React Query, patrón de useCatalogs.ts
├── lib/formatDuration.ts                 ← segundos → 'Xh Ym', un solo lugar
└── components/organisms/reports/
    ├── ReportFilters.tsx
    ├── ReportKpiCards.tsx
    ├── TimeAccountingBar.tsx             ← bloque héroe (sin Chart.js)
    ├── DowntimeParetoChart.tsx           ← Chart.js
    ├── ResponseResolutionChart.tsx       ← Chart.js
    ├── DowntimeTrendChart.tsx            ← Chart.js
    └── EventTraceTable.tsx               ← la trazabilidad (§8.7)
```

Ruta nueva en `src/config/routes.ts` (`/dashboard/reportes`) y entrada en
`src/constants/sidebarItems.ts` (ícono tipo `chart`; si no existe en `Icon.tsx`, agrégalo siguiendo el
patrón del ícono `clock` de la Fase 1).

### 8.2 Chart.js — usar el stack que ya está [VERIFICADO]

**No instales nada.** `chart.js@4.5` y `react-chartjs-2@5.3` ya son dependencias y hay cinco
componentes que los usan. **Antes de escribir el primer gráfico, abre
`src/components/molecules/RealtimeGroupChart.tsx` y `LevelChart.tsx`** y copia sus convenciones: cómo
registran los controladores, cómo manejan tema y colores, cómo dimensionan el contenedor. La
consistencia con lo que ya existe vale más que cualquier preferencia tuya.

### 8.3 Los componentes de gráfico deben ser tontos

Requisito explícito del negocio: **alimentar los gráficos con datos debe ser trivial.**

- Reciben **solo datos ya listos, por props tipadas**. Sin `fetch`, sin React Query, sin cálculos de
  negocio, sin formateo de fechas dentro.
- No saben de rangos, ni de zonas horarias, ni de la API. El bucketing y la agregación son del
  backend (§5.4); el componente solo pinta lo que recibe.
- Reutilizables: cuando el cliente pida cambiar el dashboard —y lo va a pedir— se deben poder
  recolocar o alimentar de otra fuente sin tocarlos.

```ts
interface DowntimeParetoChartProps {
  data: Array<{ label: string; seconds: number; cumulativePercent: number }>;
  loading?: boolean;
}
interface ResponseResolutionChartProps {
  data: Array<{ label: string; responseSeconds: number; resolutionSeconds: number }>;
  loading?: boolean;
}
interface DowntimeTrendChartProps {
  data: Array<{ bucket: string; scheduledSeconds: number; unplannedSeconds: number }>;
  groupBy: 'day' | 'week' | 'month';
  loading?: boolean;
}
```

La conversión de segundos a `Xh Ym` va en `lib/formatDuration.ts`, no repetida en cada componente.

### 8.4 Bloques de la pantalla, en orden

1. **Filtros** — área (`useAreas`, con "Todas las áreas"), presets de rango (Hoy / Últimos 7 días /
   Este mes / Personalizado con dos `<Input type="date">`), agrupación (Día/Semana/Mes), botón de
   Excel.
2. **5 tarjetas KPI** — Disponibilidad · Paro no programado · Paro programado · Nº de paros ·
   Atención/Solución promedio.
3. **Contabilidad del tiempo** — barra horizontal segmentada (programado / no programado / corriendo)
   **con la resta escrita en texto debajo**. CSS puro, no necesita Chart.js. **Es el bloque que cumple
   el requisito del negocio.**
4. **Pareto por departamento** — barras horizontales desc + línea de acumulado. Responde *quién detuvo
   la línea*.
5. **Atención vs solución por departamento** — barras horizontales apiladas `[atención | solución]`.
   Responde *por qué tardó*: no llegaron, o llegaron y no pudieron arreglarlo. Dos problemas distintos
   con dueños distintos.
6. **Tendencia** — barras apiladas por bucket (programado vs no programado).
7. **Tabla de eventos** (§8.7) — la trazabilidad.

Colores, consistentes en toda la pantalla y con significado:

| Concepto | Color | Por qué |
|---|---|---|
| Paro programado | gris `#898781` | Es esperado, no es un problema |
| Paro no programado | rojo `#e34948` | Es lo que hay que reducir |
| Tiempo corriendo | verde `#008300` | Es lo bueno |

### 8.5 Nota obligatoria en el Pareto

Debajo del Pareto, texto fijo:

> *La suma por departamento puede superar el paro total de la línea: cuando dos departamentos tienen
> llamadas abiertas al mismo tiempo, la línea se detiene una vez pero ambos son responsables.*

Sin esta nota, el primer supervisor que sume las barras y no le cuadre con el KPI va a asumir que el
sistema está mal, con razón aparente. Ver §5.3.

### 8.6 Advertencias de calidad del dato

**Advertencia dura** — si `summary.hasScheduledDowntimeConfigured === false`, banner `--bg-warning`
prominente arriba de los KPIs:

> *Esta área no tiene paros programados configurados. La disponibilidad se está calculando contra
> 24 h/día y no refleja el horario real de la línea.* [Configurar →]

Con enlace a *Catálogos → Paros Programados*. Sin esto, el cliente verá 25% de disponibilidad,
pensará que el sistema está roto y perderá la confianza el primer día.

**Nota permanente** — al pie, discreta pero siempre visible:

> *El sistema solo mide el paro que alguien reportó con la botonera. El paro no reportado no aparece
> aquí.*

**Disponibilidad `null`** → muestra `—` con tooltip *"La línea no tenía tiempo productivo planeado en
este rango"*. Nunca `0%`, nunca `NaN`.

### 8.7 `EventTraceTable` — la transparencia hecha pantalla

Tabla paginada (`GET /reports/events`), debajo de las gráficas. Columnas:

| Inicio | Atendido | Cierre | Departamento | Duración | Paro programado | Duración real | Atención | Solución |

- Cuando `scheduledDowntimeDiscountSeconds > 0`, la fila es **expandible**. Al expandir muestra las
  rebanadas: *"Comida (12:00–13:00) · 13/jul 12:00 → 13:00 · 1 h · durante la solución"*. **Ahí vive
  el "de qué hora a qué hora".**
- Muestra **`Duración` y `Duración real` como dos columnas contiguas**, con el descuento en medio. La
  resta debe leerse de izquierda a derecha sin pensar.
- Las horas se muestran en **hora de planta**, con la zona indicada en el encabezado de la tabla. No
  conviertas a la hora del navegador: un supervisor conectado desde otra ciudad debe ver la hora de la
  planta.
- Filas sin descuento: `Duración real` = `Duración`, sin fila expandible y sin adorno. Que la
  ausencia de descuento también sea explícita.

---

## 9. Verificación

### 9.1 Invariantes de trazabilidad (los más importantes)

En `signal.service.spec.ts` y en el spec del calculador:

1. `Σ slices.seconds === events.scheduled_downtime_discount_seconds`, **siempre**.
2. `Σ slices WHERE segment='response' === events.response_discount_seconds`.
3. Las rebanadas de un evento **no se traslapan entre sí** (§2.3).
4. **Dos paros programados traslapados** (Comida 12–13, Junta 12:30–14) y un evento 11:00–15:00 →
   `total = 120 min` (igual que el test 7 de Fase 1) **y** las rebanadas suman 120, repartidas
   `Comida 12:00–13:00 = 60` y `Junta 13:00–14:00 = 60`. Determinista: repítelo y da igual.
5. `calculator.getDiscountedSeconds()` === `calculator.getDiscount().totalDiscountedSeconds`.
6. Evento que cruza dos días con la misma comida → **dos rebanadas** con fechas distintas, no una
   colapsada.
7. Si el calculador falla, el evento **se cierra igual**, sin rebanadas y con descuento 0
   (degradación segura de Fase 1).

### 9.2 Tests del reporte (`downtime-report.service.spec.ts`)

Con `TZ=UTC` (ya forzado por `jest.config.js` desde Fase 1) y `PLANT_TIMEZONE=America/Chihuahua`:

1. **Trampa 1:** rango con paros programados pero **sin ningún paro real** →
   `scheduledDowntimeSeconds > 0`, `unplannedDowntimeSeconds = 0`, `availability = 1`. (Sumando
   descuentos de eventos daría 0 y el denominador estaría inflado.)
2. **Trampa 2:** downtime que empieza antes de `from` y termina dentro → solo la parte del rango.
3. **Trampa 3:** downtime activo → cuenta recortado a `now`.
4. **Trampa 4:** paro cerrado a las 23:30 hora de planta cae en el bucket del día de planta, no del
   día UTC siguiente.
5. **Trampa 5:** dos áreas con 100% y 50% y tiempos planeados muy distintos → agregada es el
   ponderado, no 75%.
6. **Caso borde:** rango completamente cubierto por paro programado → `availability = null`.
7. **Doble atribución:** dos eventos simultáneos de departamentos distintos →
   `Σ byDepartment > summary.unplannedDowntimeSeconds`, y el summary **no** cuenta doble.
8. Buckets sin eventos → aparecen con disponibilidad 100%, no se omiten.
9. Eventos con `in_progress_at` null → excluidos de las medias.
10. `runSeconds` nunca negativo.

### 9.3 Tests del `/recalculate`

1. `dryRun: true` **no escribe nada** y reporta el delta correcto.
2. Cambiar la ventana de un paro programado y recalcular → los descuentos y las rebanadas del
   histórico se actualizan; `duration_seconds` **no cambia**.
3. No toca eventos abiertos.
4. Tras recalcular, los invariantes de §9.1 siguen cumpliéndose.

### 9.4 Extremo a extremo

Reproduce el **caso de aceptación del negocio** de la Fase 1, ahora en el dashboard: área con "Comida"
12:00–13:00, paro real 11:30–13:30 → la pantalla muestra **1 h** de paro no programado (no 2 h), la
tabla de eventos lo desglosa con la rebanada *13/jul 12:00 → 13:00*, y el Excel permite rehacer la
resta en la hoja 2.

```bash
cd backend-receptor && npx jest && npx tsc --noEmit -p tsconfig.json   # 143 = línea base
cd ../dashboard-test && npx tsc --noEmit                                # 0 errores
```

---

## 10. Checklist de aceptación

**Trazabilidad**
- [ ] Verificado que `events.scheduled_downtime_snapshot` NO existe (§2.2).
- [ ] El calculador produce **rebanadas disjuntas** y `total === Σ slices` incluso con paros
      traslapados.
- [ ] `event_scheduled_downtime_slices` guarda `occurred_from`/`occurred_to` y el nombre **congelado**.
- [ ] Evento y rebanadas se escriben en la **misma transacción**.
- [ ] Los invariantes de §9.1 pasan.
- [ ] La tabla de eventos muestra `Duración → Paro programado → Duración real` contiguos y expande al
      detalle horario.

**Dashboard**
- [ ] `GET /reports/downtime` responde el contrato exacto de §5.2.
- [ ] **Trampa 1 respetada** (verificable: rango sin paros reales debe reportar paro programado > 0).
- [ ] Trampas 2–5 cubiertas por los tests de §9.2.
- [ ] Disponibilidad `null` cuando el planeado es 0; la UI muestra `—`.
- [ ] La barra de contabilidad del tiempo cuadra con los KPIs.
- [ ] Los tres gráficos usan el Chart.js instalado, con props tipadas y sin lógica de negocio.
- [ ] Banner de advertencia si el área no tiene paros programados configurados.
- [ ] Nota del Pareto sobre doble atribución; nota permanente de "solo se mide el paro reportado".
- [ ] **La palabra "OEE" no aparece en ningún lado.**

**Recalculate y Excel**
- [ ] `dryRun` es el default y no escribe.
- [ ] `/recalculate` nunca toca `duration_seconds` ni las marcas de tiempo.
- [ ] Excel con 3 hojas; hoja 2 con todos los tiempos visibles; hoja 3 con el detalle horario y
      nombres congelados, en hora de planta.
- [ ] `exceljs` es la única dependencia nueva.
- [ ] `tsc` backend = 143 (línea base), frontend = 0.

---

## 11. Orden sugerido de implementación

Esta fase creció. Constrúyela en este orden; cada bloque es desplegable y verificable solo:

1. **§2 + §4** — enmienda del calculador (rebanadas disjuntas), columna, tabla, migración, cambio en
   `closeEvent`. **Aquí están los invariantes; si esto está mal, todo lo demás miente.**
2. **§6** — `/recalculate`. Antes que el dashboard: es la red de seguridad de todo lo anterior.
3. **§5** — endpoints de reporte.
4. **§8.7** — tabla de eventos (la transparencia, que es el requisito duro).
5. **§8.1–8.6** — el resto del dashboard.
6. **§7** — Excel.

## 12. Fuera de alcance

- **No es OEE** y no se intentará: faltan conteo de piezas y de scrap.
- **Sin motivos de evento**: el Pareto es por *departamento*. La Fase 3 lo sube de *quién* a *por qué*.
- **Sin mediana ni p95**: solo media (§5.5).
- **Sin comparación entre rangos** ("esta semana vs. la anterior").
- **Sin dashboard en tiempo real**: esta pantalla es de análisis histórico. El tablero en vivo ya
  existe y no se toca.

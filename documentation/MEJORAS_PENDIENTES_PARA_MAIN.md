# SPEC EJECUTABLE — Migración de mejoras y bugfixes de `sql-server-version-2` a `main`

> **Fecha:** 2026-07-13 · **Merge-base:** `6b0fbce` · **Punta de la rama analizada:** `6d76572`
> **Alcance del análisis:** `git diff main...sql-server-version-2` — 48 commits, 176 archivos,
> ~12,700 inserciones, revisados archivo por archivo (no solo mensajes de commit).
> `main` no tiene ningún commit que la rama no tenga.
>
> Este documento es una **especificación de ejecución** para migrar a `main` (PostgreSQL)
> todo lo portable de la rama del cliente (SQL Server), dirigida a un agente/desarrollador
> que trabajará en el repo. Las decisiones de producto ya están tomadas (ver §0.2).

---

## 0. Reglas operativas (LEER PRIMERO)

### 0.1 Estrategia: port manual, NUNCA cherry-pick
Los commits de la rama **mezclan features con adaptaciones mssql** en los mismos archivos
(ej. `9317fec` trae el feature chart2 *y* tipado `nvarchar(max)` en la misma entidad).
Un `git cherry-pick` contaminaría main con código mssql.

**Procedimiento por ítem:**
1. Ver el diff exacto del archivo: `git diff main...sql-server-version-2 -- <ruta>`
2. Aplicar en main **solo** los hunks del feature/fix, siguiendo las instrucciones
   "Cómo portar" de cada sección.
3. Descartar sistemáticamente estos patrones (son adaptación mssql, main ya está bien):
   - Eliminación de `type: 'timestamp with time zone'`, `type: 'boolean'`, `type: 'enum'`
     en decoradores `@Column`/`@CreateDateColumn`/etc.
   - Cambios `type: 'jsonb'` → `type: 'nvarchar', length: 'max'` o `'simple-json'`,
     y los `ValueTransformer` que los acompañan.
   - Cambios `ILIKE` → `LOWER(...) LIKE LOWER(...)` en repositorios.
   - Cualquier branch `isMSSQL()` en código de aplicación (en migraciones sí se permite,
     ver §3).
4. Verificar con el criterio de aceptación del ítem antes de pasar al siguiente.

### 0.2 Decisiones ya tomadas (no re-preguntar)
| Tema | Decisión |
|---|---|
| Unidad de temperatura | **main conserva °C.** No portar el cambio °C→°F de `measurementUtils.ts` ni de los 2 archivos de test. `dew_point` se agrega con unidad **°C**. |
| Switch `DATABASE_TYPE` en `app.module.ts` | **NO portar.** Main queda solo-PostgreSQL con su factory actual. |
| Migración `CreateAdminUser` | **Portar parametrizada por env** (ver §3.3). |
| Deploy Docker de virtual-device | **SÍ incluir en main, activo por defecto** (ver §8). |
| Unique de `measurements.external_id` | **NO portar las 3 migraciones de la rama.** Main ya lo resolvió con índice único parcial (ver §2.1). |

### 0.3 Estado real de main (verificado, no asumir lo contrario)
- Main **ya tiene** el índice único parcial `IDX_measurements_external_id_unique`
  (`WHERE deleted_at IS NULL`) vía migración `20260108073800-UpdateMeasurementsExternalIdUniqueConstraint`,
  y su `measurement.entity.ts` ya no declara `unique` en `external_id`.
- Main **ya tiene** las migraciones `InitialSchema`, `UpdateTorretasExternalIdUniqueConstraint`,
  `RemoveOrderFromTorretaColors`, `AddChartConfigToDashboardMeasurementGroups`,
  `RefactorAlertMessagesStructure`, `AddStatusToMeasurementType` en versión PostgreSQL.
  La rama las reescribió para mssql — **no tocar las de main**.
- Las migraciones **nuevas** de la rama listadas en §3.1 son **dual-dialecto**: contienen
  un branch PostgreSQL correcto (`jsonb`, `ALTER TYPE ... ADD VALUE`, `$1` params).
  Se copian **verbatim** — ya funcionan en PG.

### 0.4 Cabos técnicos ya resueltos en este análisis
- **`alert-escalation.service.ts` / URL resuelta:** NO es bug. `sendMessagesToEndpoint()`
  resuelve la URL internamente (línea ~81: `const resolvedUrl = this.resolveEndpointUrl(endpointUrl)`)
  antes del `httpService.post`. Los callers le pasan `config.endpointUrl` sin resolver y
  eso es correcto; el `resolvedUrl` que calculan aparte es solo para `logAlertSent`.
  Portar tal cual está en la rama.
- **`findActiveByExternalId` (§2.1):** TypeORM `findOne` ya excluye soft-deleted por
  defecto con `@DeleteDateColumn`, así que en main el bug original puede no reproducirse.
  Se porta de todos modos (explícito > implícito, y mantiene paridad con la rama).
  Riesgo: nulo.

### 0.5 Orden de ejecución
Seguir §3 (migraciones) → §1 (backend features) → §2 (backend fixes) → §4/§5 (frontend)
→ §6 (virtual-device) → §7 (tests) → §8 (docker) → §12 (verificación final).
Commits pequeños por ítem, mensaje `port(sql-server-version-2): <ítem>`.

---

## 1. Backend — Features nuevos

### 1.1 Segunda gráfica por grupo (chart2)
**Ref:** commit `9317fec` · Archivos: módulo `dashboard-measurements` completo.

**Cómo portar:**
- `application/dtos/dashboard-measurement-group.dto.ts`: copiar los campos
  `chart2TimeRange`, `chart2MinValue`, `chart2MaxValue`, `chart2MeasurementIds` en
  `CreateDashboardMeasurementGroupDto` y `UpdateDashboardMeasurementGroupDto`
  (validadores `@IsIn([1,10,30,60,120,240,480])`, `@IsNumber`, `@IsArray`+`@IsInt`).
- `application/services/dashboard-measurement-group.service.ts`: copiar el diff completo
  de `createGroup` y `updateGroup` (validaciones chart2, refactor de
  `groupMeasurementIds`/`statusMeasurementIds`, manejo de `null`, recarga con
  `findByIdWithMeasurements` al final del update). Este archivo NO tiene código mssql —
  el diff se aplica entero (incluye también §1.2 y §2.2).
- `domain/entities/dashboard-measurement-group.entity.ts`: **NO copiar el archivo de la
  rama** (tiene `nvarchar`+transformer). Agregar a la entidad de main exactamente:

```ts
@Column({ name: 'chart2_time_range', type: 'int', nullable: true })
chart2TimeRange?: number;

@Column({
  name: 'chart2_min_value',
  type: 'decimal',
  precision: 10,
  scale: 2,
  nullable: true,
})
chart2MinValue?: number;

@Column({
  name: 'chart2_max_value',
  type: 'decimal',
  precision: 10,
  scale: 2,
  nullable: true,
})
chart2MaxValue?: number;

@Column({ name: 'chart2_measurement_ids', type: 'jsonb', nullable: true })
chart2MeasurementIds?: number[];
```

  El `chartMeasurementIdsTransformer` de la rama **no se porta**; `chart_measurement_ids`
  de main se queda `jsonb` sin transformer.

**Aceptación:** `POST /dashboard-measurement-groups` con
`{chart2TimeRange: 10, chart2MinValue: 0, chart2MaxValue: 100, chart2MeasurementIds: [..]}`
persiste y devuelve los campos; ids inválidos o de tipo `status` → 400; `chart2MinValue >= chart2MaxValue` → 400.

### 1.2 Orden configurable de measurements (drag & drop — parte backend)
**Ref:** commit `f96cf28`.

**Cómo portar:**
- Entidad (main, tipos PG):

```ts
@Column({ name: 'dashboard_measurement_order', type: 'jsonb', nullable: true })
dashboardMeasurementOrder?: number[];
```

- DTOs: campo `dashboardMeasurementOrder?: number[]` (`@IsArray`+`@IsInt({each:true})`,
  opcional) — ya incluido en el diff del DTO de §1.1.
- Service: en `createGroup` y en el bloque `updateDto.dashboardMeasurements` de
  `updateGroup`, asignar `group.dashboardMeasurementOrder = dashboardMeasurementIds`
  (viene en el diff de §1.1).
- `domain/repositories/dashboard-measurement-group.repository.ts`: copiar el archivo de la
  rama completo (método `sortDashboardMeasurements()` + su uso en
  `findAllWithMeasurements` y `findByIdWithMeasurements`). No tiene código mssql.

**Aceptación:** actualizar un grupo enviando los measurements en orden B,A,C →
`GET /dashboard-measurement-groups/:id` devuelve `dashboardMeasurements` en orden B,A,C.

### 1.3 Tipos `dew_point` y `ppm`
**Ref:** commits `78dd85f`, `8243272`.

**Cómo portar** — en `measurement.entity.ts` de main, tocar SOLO el enum:

```ts
export enum MeasurementType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  DEW_POINT = 'dew_point',
  PPM = 'ppm',
  PRESSURE = 'pressure',
  // ... resto sin cambios
}
```

⛔ NO copiar de la rama: la eliminación de `type: 'enum'` ni el
`default: MeasurementType.TEMPERATURE` en la columna `type` (eso era para mssql).
La columna en main se queda `@Column({ type: 'enum', enum: MeasurementType })`.

Migraciones: ver §3.1 (se copian verbatim, su branch PG hace
`ALTER TYPE "public"."measurements_type_enum" ADD VALUE IF NOT EXISTS ...`).

**Aceptación:** `POST /measurements` con `type: 'dew_point'` y con `type: 'ppm'` → 201.

### 1.4 Estado on/off con duración de servidor (measurements `status`)
**Ref:** commits `9317fec`, `638addc`.

**Cómo portar:**
- `measurement-value.repository.ts`: copiar `findStatusOffStartTime()` completo y la
  reescritura de `findStatusOnStartTime()` (ver §2.3). Copiar `getDatabaseNow()` pero
  **simplificado a PG** (eliminar `isMSSQL()` y el branch `SYSUTCDATETIME`):

```ts
async getDatabaseNow(): Promise<Date> {
  try {
    const result = await this.measurementValueRepository.query(
      'SELECT NOW() AS now'
    );
    const value = result?.[0]?.now;
    return value instanceof Date ? value : new Date(value);
  } catch (error) {
    this.logger.error(
      `Error getting database time: ${(error as Error).message}`
    );
    return new Date();
  }
}
```

- `dashboard-measurement.service.ts`: copiar el diff completo de
  `getAllDashboardMeasurements` (helper `parseBooleanValue`, `offStartTime`,
  `statusState`, `statusStartTime`, `statusDurationSeconds`, `serverTime`, y el fallback a
  `findByGroupId` cuando el grupo no tiene measurements). No tiene código mssql.
- ⛔ NO copiar de `measurement-value.entity.ts` la eliminación de
  `type: 'timestamp with time zone'`.

**Aceptación:** con un measurement `status` cuyo último valor es `false`,
`GET /dashboard-measurements?groupId=X` devuelve `statusState: "off"`,
`offStartTime`, `statusDurationSeconds` creciente entre llamadas y `serverTime` ISO.

### 1.5 Módulo backend `virtual-device`
**Ref:** commits `77f9829`, `b5be6e9`.

**Cómo portar** (archivos nuevos y cambios sin código mssql — copiar verbatim):
- `src/virtual-device/virtual-device.module.ts` (nuevo)
- `src/virtual-device/controllers/virtual-device.controller.ts` (nuevo)
- `src/permissions/constants/permissions.constants.ts`: agregar
  `VIRTUAL_DEVICE = 'virtual-device'` al enum `Module`.
- `src/app.module.ts`: SOLO el import y registro de `VirtualDeviceModule`
  (⛔ NO el bloque `DATABASE_TYPE` — decisión §0.2).
- Depende de §2.6 (el controller llama `signalService.processVirtualDeviceSignal`) y de la
  migración §3.1-e (permiso/rol).

**Aceptación:** sin token → 401 en `GET /virtual-device/devices`; con usuario que tiene el
rol `Virtual Device User` → 200 y solo dispositivos `isVirtualDevice`;
`GET /virtual-device/line-stop/:areaId` devuelve `{startAt: null}` sin eventos activos y
un ISO con downtime activo.

### 1.6 `NODE_RED_EVENTS_URL` configurable
**Ref:** commits `5e2f253`, `638addc`.

**Cómo portar** (ninguno de estos archivos tiene código mssql; los cambios de entidades
que los acompañan sí — separar):
- `src/config/node-red-events-url.ts` (nuevo) — copiar verbatim.
- `alert-escalation.service.ts`: copiar diff completo (usa el resolver central, elimina
  `endpointUrl` hardcodeado, `logAlertSent` con URL resuelta y snapshot tipado §1.7).
- `alert-escalation-config.service.ts`: `endpointUrl: resolveNodeRedEventsUrl()` (2 lugares).
- `alert-message-sender.service.ts`: copiar diff completo.
- `area-torreta-signal.service.ts`: copiar diff completo (incluye el `logger.warn` cuando
  el área no tiene torretas configuradas).
- `alert-escalation-config.entity.ts`: SOLO el cambio de default de `endpoint_url` a
  `'http://localhost:1880/events'` (⛔ no los cambios de tipos de columnas).
- `test-helpers/entity-factories.ts`: los 2 cambios de URL default.
- Specs: ver §7.
- **Config:** agregar `NODE_RED_EVENTS_URL` a `.env.example` del backend y al
  docker-compose de main (ej. `NODE_RED_EVENTS_URL=http://host.docker.internal:1880/events`
  para el deploy en Docker; sin la variable, el default es `http://localhost:1880/events`).

**Aceptación:** correr los specs de §7; con `NODE_RED_EVENTS_URL` seteada, los POST a
Node-RED van a esa URL (verificable en logs de `logMessages`).

### 1.7 Tipado del snapshot en `EventAlertLog`
**Ref:** commit `638addc`.

**Cómo portar:**
- `event-alert-log.repository.ts`: copiar verbatim (tipos `EventAlertLogMessageSnapshot`/
  `EventAlertLogMessageInput`, helper `toEventAlertLogMessageSnapshot`, DTO tipado).
- `event-alert-log.entity.ts`: portar SOLO el tipado TS de `messagesSent`
  (array del snapshot en vez de `unknown[]`). ⛔ La columna se queda
  `@Column({ name: 'messages_sent', type: 'jsonb' })` — NO cambiar a `simple-json`.
  ⛔ Tampoco portar la eliminación de `type: 'enum'` en `level` ni el cambio de `sent_at`.

**Aceptación:** `pnpm build` del backend sin errores TS; specs de alert-escalation verdes.

---

## 2. Backend — Bugs resueltos

### 2.1 Raw-measurements vs measurements soft-deleted
**Ref:** commits `b1a669e`, `3852fc3`, `c023b00`, `a18e7d1`.

**Cómo portar (SOLO código, cero migraciones — ver §0.3):**
- `measurement.repository.ts`: agregar `findActiveByExternalId()` (import `IsNull` de typeorm):

```ts
async findActiveByExternalId(
  externalId: string
): Promise<Measurement | null> {
  return await this.measurementRepository.findOne({
    where: { externalId, deletedAt: IsNull() },
  });
}
```

- `measurement.service.ts`: agregar `getActiveMeasurementByExternalId()` (copiar de la rama).
- `raw-measurement.service.ts` → `createMeasurementValueIfExists`: usar el método nuevo.
- ⛔ NO portar: `1767857880000-...`, `1769104800000-...`, `1769107500000-...`
  (las 3 migraciones del unique). Main conserva su `20260108073800` con índice parcial.
- ⛔ NO portar los cambios de tipos en `raw-measurement.entity.ts`.

**Aceptación (e2e manual):** crear measurement con externalId `X` → soft-delete →
crear otro con externalId `X` (debe permitirlo) → mandar raw-measurement con `X` →
el `measurement_value` se asocia al measurement **activo**, no al borrado.

### 2.2 Edición de grupos de measurements
**Ref:** commit `c5380ff`. Incluido en el diff del service de §1.1 (mismo archivo).
Fixes que trae: validación de `chartMeasurementIds` contra los measurements **nuevos**
del request (no los viejos del grupo), distinción `undefined`/`null` para poder limpiar
config, y respuesta con datos frescos vía `findByIdWithMeasurements`.

**Aceptación:** actualizar un grupo cambiando en el mismo request sus measurements Y
`chartMeasurementIds` referenciando los nuevos → 200 (antes 400);
enviar `{chartTimeRange: null, chartMinValue: null, chartMaxValue: null, chartMeasurementIds: []}`
→ la config de gráfica queda limpia; la respuesta del PATCH refleja el estado final.

### 2.3 Algoritmo de `findStatusOnStartTime`
**Ref:** `9317fec`/`638addc`. Incluido en §1.4 (mismo archivo). Reescritura: último `false`
hacia atrás → primer `true` después (o primer `true` absoluto si nunca hubo `false`).

**Aceptación:** secuencia de valores `[true, false, true, true]` → onStartTime = timestamp
del 3er valor; `[true, true]` → timestamp del 1ro; `[.., false]` → `null`.

### 2.4 Timestamps ISO en eventos WebSocket
**Ref:** commit `638addc`.
- `measurement-value.repository.ts#create`: asignar `createdAt = await this.getDatabaseNow()`
  antes de guardar; emitir `createdAt` como ISO string (copiar diff).
- `raw-measurement.service.ts#emitWebSocketEvent`: `createdAt` a ISO string (copiar diff).

**Aceptación:** en el payload WS `new-measurement-value`, `createdAt` es string ISO con
sufijo `Z`/offset (inspeccionar con un cliente socket.io o logs).

### 2.5 `startAt` real del paro de línea
**Ref:** commit `b5be6e9`.
- `area-downtime.service.ts#createDowntimeWithEvents`: copiar diff (startAt = `createdAt`
  más antiguo entre evento disparador y eventos activos preexistentes).
- ⛔ NO portar cambios de tipos en `area-downtime*.entity.ts`.

**Aceptación:** con un evento activo creado a las 10:00 y otro a las 10:05 que dispara el
downtime, `area_downtimes.start_at` = 10:00.

### 2.6 Unificación de flujo hardware/virtual-device en `signal.service.ts`
**Ref:** commit `b5be6e9`.
- Copiar el diff completo de `signal.service.ts`: tipo `EventSignalContext`, firma nueva de
  `handleEventLogic`/`createNewEvent`, eliminación de `handleEventLogicForVirtualDevice` y
  `createNewVirtualDeviceEvent` (~120 líneas). No tiene código mssql.
- Copiar el diff de `signal.service.spec.ts` (tests renombrados al flujo unificado).

**Aceptación:** `pnpm test signal.service` verde; una señal de virtual-device crea evento
con `virtualDevice: true`, `reason` y `comment`; el ciclo open→in-progress→closed funciona
igual desde `POST /signals` y desde `POST /virtual-device/signals`.

---

## 3. Migraciones de BD

### 3.1 Copiar VERBATIM (son dual-dialecto con branch PG correcto, verificado)
Copiar estos archivos de la rama a `backend-receptor/src/migrations/` de main sin cambios:

| # | Archivo | Qué hace en PG |
|---|---|---|
| a | `1769194800000-AddDashboardMeasurementOrderToGroups.ts` | `ADD COLUMN dashboard_measurement_order jsonb` |
| b | `1769196600000-AddDewPointToMeasurementType.ts` | `ALTER TYPE measurements_type_enum ADD VALUE IF NOT EXISTS 'dew_point'` |
| c | `1769197800000-AddPpmToMeasurementType.ts` | idem `'ppm'` |
| d | `1769601600000-AddSecondChartConfigToDashboardMeasurementGroups.ts` | `ADD COLUMN chart2_time_range integer / chart2_min_value decimal(10,2) / chart2_max_value decimal(10,2) / chart2_measurement_ids jsonb` |
| e | `1773271257507-CreateVirtualDeviceRole.ts` | permiso `virtual-device:create` + rol `Virtual Device User` + role_permission (inserts idempotentes) |

Comando: `git show sql-server-version-2:backend-receptor/src/migrations/<archivo> > backend-receptor/src/migrations/<archivo>`

Los branches `isMSSQL()` dentro de estas migraciones son inertes en main; se aceptan para
mantener los archivos idénticos entre ramas.

### 3.2 NO copiar
- `1769200000000-FixAreaDowntimeMssqlColumns.ts` — solo mssql.
- `1767857880000/1769104800000/1769107500000` (unique de measurements) — main ya tiene la
  solución correcta (§0.3). **Tampoco** eliminar `20260108073800-...` de main.
- `1768651367000-SeedMeasurementsFromCsv.ts`, `1774987290155-SeedPendingMeasurementsAuditCsv.ts`
  y `backend-receptor/data/pending-measurements-audit.csv` — datos del cliente Leoni.
- Las versiones reescritas de las 6 migraciones que main ya tiene (§0.3).

### 3.3 `9999999999999-CreateAdminUser.ts` — portar ADAPTADA
La versión de la rama es dual-dialecto, idempotente (verifica existencia del usuario) y
hashea con `bcrypt.hashSync(pass, 10)`, pero hardcodea `ADMIN` / `Admin123!`.

**Adaptación requerida al copiarla a main:**
1. Eliminar los branches `isMSSQL()` (dejar solo el SQL PG con `$1` y `NOW()`).
2. Credenciales desde env:

```ts
const username = process.env['ADMIN_USERNAME'];
const password = process.env['ADMIN_PASSWORD'];
if (!username || !password) {
  console.warn(
    '⚠️  ADMIN_USERNAME/ADMIN_PASSWORD no definidos; se omite la creación del admin inicial'
  );
  return;
}
const hashedPassword = bcrypt.hashSync(password, 10);
```

3. Documentar ambas variables en `.env.example`.

**Aceptación:** `migration:run` sin las vars → warning y continúa; con las vars → usuario
creado y login OK; segunda corrida → "ya existe, saltando".

### 3.4 Verificación del bloque de migraciones
En una BD PostgreSQL de prueba: `pnpm migration:run` desde cero (todas las de main +
las nuevas) termina sin error, y `\d dashboard_measurement_groups` muestra
`chart2_time_range (integer)`, `chart2_min_value/max (numeric(10,2))`,
`chart2_measurement_ids (jsonb)`, `dashboard_measurement_order (jsonb)`;
`SELECT unnest(enum_range(NULL::measurements_type_enum))` incluye `dew_point` y `ppm`.

---

## 4. Frontend `dashboard-test` — Features

> Ningún archivo de `dashboard-test/src` contiene código específico de mssql; los diffs se
> aplican completos **salvo las excepciones marcadas ⚠️**. Instalar antes las dependencias
> de §11.

### 4.1 Chart2 (segunda gráfica)
Copiar diffs completos de: `pages/dashboardMeasurements.tsx`,
`components/organisms/CreateDashboardGroupModal.tsx`,
`components/organisms/EditDashboardGroupModal.tsx`,
`types/dashboard-measurement-group.ts`, `lib/validations/schemas.ts`,
`hooks/useDashboardMeasurementGroups.ts`,
`lib/services/dashboard-measurement-group.service.ts`.

⚠️ Excepciones dentro de esos archivos:
- `dashboardMeasurements.tsx`: eliminar el bloque muerto
  `if (dashboard.measurement?.type === "status") { }` (vacío) y la línea comentada del
  grid viejo (`{/* <div className="grid ... */}`).
- `dashboard-measurement-group.service.ts`: `normalizeChartMeasurementIds` nació por mssql
  (parsea JSON/CSV string). Portarlo igualmente — es defensivo e inofensivo con `jsonb`.

**Aceptación:** crear grupo con 2 charts configurados → la página muestra ambas gráficas
lado a lado (la segunda con colores invertidos); grupo con solo chart1 → una gráfica a lo
ancho; botón "Limpiar configuración" en edición borra la config en BD.

### 4.2 Drag & drop de measurements
Incluido en el diff de `EditDashboardGroupModal.tsx` (§4.1): `SortableMeasurementItem`,
`DndContext`/`SortableContext`, `move()`, y el fix de orden de
`selectedDashboardMeasurements` (mapear desde `selectedIds`, no filtrar el catálogo).
Requiere `@dnd-kit/*` (§11).

**Aceptación:** en el modal de edición, arrastrar un measurement al inicio → guardar →
reabrir el modal y ver el grupo: el orden persiste (usa `dashboard_measurement_order`).

### 4.3 Charts nuevos y tipos `dew_point`/`ppm`
- Archivos nuevos, copiar verbatim: `components/molecules/LiquidFillGauge.tsx`,
  `components/molecules/DewPointDonutChart.tsx`, `lib/dateTime.ts`, `lib/timeSync.ts`,
  `hooks/useDurationTicker.ts`.
- Copiar diffs completos: `MeasurementChart.tsx` (ruteo por tipo), `GaugeChart.tsx`
  (`getGaugeColor` + init correcto), `HorizontalBarChart.tsx`, `VibrationLineChart.tsx`,
  `StatusIndicatorCard.tsx`, `CollapsibleSection.tsx`, `useMonitoringConditions.ts`,
  `types/dashboard.ts`, `types/measurement.ts`, `types/alertRule.ts`,
  `CreateMeasurementForm.tsx`, `CreateDashboardMeasurementModal.tsx`,
  `EditDashboardMeasurementModal.tsx`, `SignalDetail.tsx`.
- ⚠️ `lib/measurementUtils.ts`: portar las entradas nuevas `dew_point` y `ppm`, pero
  **manteniendo °C** en `temperature` y usando **°C también en `dew_point`**
  (la rama trae `°F` — decisión §0.2). NO portar el cambio de unit/formatValue de
  `temperature`.
- ⚠️ `RealtimeGroupChart.tsx` y `useRealtimeGroupChartData.ts`: copiar diffs completos
  PERO eliminar los bloques de `console.log` con throttle (`lastLogAtRef`,
  `console.log("[RealtimeGroupChart]"...)` y `console.log("[RealtimeGroupChartData]"...)`)
  — eran diagnóstico del deploy.
- ⚠️ Tarjetas con tamaño fijo `h-[25rem] w-[25rem]` + grid `flex flex-wrap`: portar tal
  cual (es el layout probado con el cliente); si en main se prefiere el grid responsivo
  anterior, es un cambio de 2 líneas posterior — no bloquear la migración por esto.

**Aceptación:** measurement `humidity` renderiza LiquidFillGauge animado; `ppm` con patrón
punteado; `dew_point` renderiza dona con valor en °C; `temperature` sigue mostrando °C.

### 4.4 Sincronización de hora y duración on/off
Incluido en los archivos ya listados; además copiar diff completo de
`hooks/useRealtimeMeasurementValues.ts` y `hooks/useStatusDuration.ts`.
Depende de backend §1.4 (campos `offStartTime`/`statusDurationSeconds`/`serverTime`).

**Aceptación:** poner el reloj del cliente 10 min adelantado → los contadores de status y
la ventana de la gráfica realtime siguen correctos (usan hora del servidor); tras F5, una
tarjeta status en OFF muestra contador rojo con la duración correcta sin esperar eventos WS.

### 4.5 Misceláneos
Copiar diffs de: `atoms/Button.tsx` + `atoms/index.ts` (re-export HeroUI),
`EscalationConfigModal.tsx` (classNames del Input).
⚠️ `lib/services/__tests__/dashboard-measurement.service.test.ts` y
`test-utils/mock-data.ts`: NO portar (su único cambio es `°C`→`°F`).

---

## 5. Frontend — matriz bug → verificación

| Bug corregido | Verificación manual |
|---|---|
| Duración status desfasada del servidor | §4.4 |
| Tarjetas status vacías tras refresh | §4.4 |
| Estado OFF sin contador | Contador rojo visible en OFF |
| Gráfica realtime: CPU alta / eje desincronizado | Con rango 8h la página no se degrada; eje X muestra horas reales |
| Interpolación a través de huecos | Detener el emisor 10s → la línea se corta, no une los puntos |
| Editar grupo: payload rechazado / UI stale | §2.2 + al guardar, la UI refleja el cambio sin F5 |
| Remover measurement no lo quitaba de charts | Quitar un measurement usado en chart1/chart2 → desaparece de ambos checkboxes y del submit |
| "Actualizado:" con hora incorrecta | Timestamp local correcto en todas las tarjetas |

---

## 6. `virtual-device` — port completo

**Ref:** commits `77f9829`, `b5be6e9`. Depende de backend §1.5 y migración §3.1-e.
Instalar dependencias §11.

- Archivos nuevos, copiar verbatim: `src/contexts/AuthContext.tsx`,
  `src/pages/LoginPage.tsx`, `src/pages/AccessDeniedPage.tsx`, `src/lib/api.ts`,
  `src/lib/services/auth.service.ts`, `src/components/organisms/StatusBar.tsx`,
  `src/components/molecules/DeviceInfoCompact.tsx`.
- Copiar diffs completos: `src/App.tsx`, `src/main.tsx`, `src/services/api.ts`
  (endpoints `/virtual-device/*` + Bearer), `src/components/VirtualDeviceApp.tsx`,
  `DepartmentCard.tsx`, `DepartmentGrid.tsx`, `DeviceInfo.tsx`, `DeviceSelector.tsx`,
  `SignalModal.tsx`, `scripts/dev-setup.js`, `README.md`.
- ⚠️ `src/config/api.ts`: la rama agregó `AUTH_TOKEN: import.meta.env.VITE_AUTH_TOKEN`.
  **NO portar** esa línea — quedó sin uso tras implementar el login real (el token vive en
  localStorage vía AuthContext); era un vestigio del deploy.
- ⚠️ Verificar que `src/lib/api.ts` use `import.meta.env.VITE_API_URL || "/api"` como
  fallback coherente con el nginx de main (la rama tiene `"http://localhost:3000"`;
  ajustar el default a lo que use main).

**Aceptación:** sin sesión → LoginPage; login con usuario sin rol Virtual Device →
AccessDeniedPage; con rol → app funcional: enviar señal crea evento (rojo "ALERTA ACTIVA"
con cronómetro), segundo envío → "EN PROCESO" (naranja), tercero → cierra;
la barra "Línea detenida" conserva el tiempo tras F5; el dispositivo seleccionado
persiste tras F5 (sessionStorage).

---

## 7. Tests

- Copiar verbatim: `dashboard-test/cypress/e2e/measurements/MeasurementsPage.cy.ts` (nuevo).
- Copiar diffs: `cypress/e2e/alerts/AlertsPage.cy.ts`, `cypress/support/commands.ts`,
  `cypress.config.ts`.
- Backend specs (van con sus ítems): `alert-message-sender.service.spec.ts` (§1.6),
  `area-torreta-signal.service.spec.ts` (§1.6), `signal.service.spec.ts` (§2.6).
- ⛔ NO portar: cambios `°C`→`°F` en tests de dashboard-test (§4.5).

**Aceptación:** `pnpm test` (backend) verde; `pnpm cypress run` verde contra un entorno
con PostgreSQL.

---

## 8. Docker / Deploy (decisión §0.2: virtual-device activo por defecto en main)

- Copiar verbatim: `docker/Dockerfile.virtual-device`, `docker/nginx.virtual-device.conf`.
- `docker/docker-compose.yml`: portar SOLO el wiring del servicio virtual-device
  (+3 líneas en el diff) — verificar contra `git diff main...sql-server-version-2 -- docker/docker-compose.yml`.
- `docker/nginx.conf`: portar el bloque de proxy del virtual-device (+7/-1).
- Agregar `NODE_RED_EVENTS_URL` al compose/env del backend (§1.6).
- ⚠️ `docker/Dockerfile.backend`, `Dockerfile.unified`, `.dockerignore`: la rama los
  simplificó pero los reorientó a mssql (copian `scripts/ensure-mssql-database.js`).
  **Default: no tocarlos en main.** Si se quiere adoptar alguna simplificación genérica,
  hacerlo como cambio separado revisado a mano, nunca copiando el archivo entero.
- ⛔ NO portar: `docker/sql-server-version/` completo,
  `backend-receptor/scripts/ensure-mssql-database.js`, `scripts/run-migrations-docker.js`,
  el `ormconfig.ts` de la rama (hardcodeado a mssql con credenciales), y el commit
  `3672cf6` (comentar virtual-device — era para Leoni).

**Aceptación:** `docker compose up` en main levanta backend+dashboard+virtual-device;
el virtual-device es accesible y hace login contra el backend del compose.

---

## 9. ⛔ Lista negra consolidada (nunca portar)

1. `ormconfig.ts` de la rama (mssql hardcodeado + credenciales).
2. Bloque `DATABASE_TYPE`/mssql en `app.module.ts` (decisión §0.2).
3. Cambios de tipado de columnas en ~30 entidades (§0.1 punto 3).
4. `ILIKE` → `LOWER LIKE` en repositorios (area/department/device/device-signal/email/role/user).
5. `mssql` y `@types/mssql` en package.json; `chartjs-adapter-dayjs` (duplicado sin uso —
   solo se porta `chartjs-adapter-dayjs-4`).
6. Migraciones: `FixAreaDowntimeMssqlColumns`, seeds CSV Leoni, las 3 del unique de
   measurements, reescrituras mssql de migraciones existentes.
7. `docker/sql-server-version/` y scripts mssql.
8. °C→°F en `measurementUtils.ts` y tests (decisión §0.2).
9. **`user.controller.ts`: los guards comentados.** En la rama
   `@UseGuards(JwtAuthGuard, PermissionGuard)` está comentado (hack de debugging que dejó
   `/users` sin auth). Main los tiene activos — **verificar tras la migración que siguen
   activos** (`grep -n "UseGuards(JwtAuthGuard" backend-receptor/src/users/controllers/user.controller.ts`).
10. `console.log` de diagnóstico en `RealtimeGroupChart.tsx`/`useRealtimeGroupChartData.ts`
    y `VITE_AUTH_TOKEN` en `virtual-device/src/config/api.ts` (§4.3, §6).
11. Hardcodes de red de los commits de deploy (`86e33cc`, `a066416`) — toda URL/IP debe
    quedar en variables de entorno.

---

## 10. Documentación (opcional, al final)

`PROJECT_OVERVIEW.md`, `documentation/ANALISIS_APLICACION.md`,
`documentation/FINAL_INSTRUCTIONS.md`, `documentation/INTEGRACION_HARDWARE_ENDPOINTS.md`,
`documentation/MODULOS_SIDEBAR.md` — revisar a mano: describen la instalación del cliente
(SQL Server); portar solo si se reescriben las secciones de BD para PostgreSQL.
La rama eliminó `dashboard-test/ANALISIS_MANEJO_ERRORES_MODALES.md` (obsoleto) — se puede
eliminar también en main.

---

## 11. Dependencias a instalar

```bash
# dashboard-test
pnpm --dir dashboard-test add dayjs chartjs-adapter-dayjs-4 @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# virtual-device
pnpm --dir virtual-device add axios @tanstack/react-query react-hook-form @hookform/resolvers zod
```

⛔ NO instalar: `mssql`, `@types/mssql`, `chartjs-adapter-dayjs` (sin el `-4`).
Opcional dev: `baseline-browser-mapping` (tooling; solo si el build lo pide).

---

## 12. Verificación final (checklist de cierre)

1. `pnpm --dir backend-receptor build && pnpm --dir backend-receptor test` — verde.
2. BD PostgreSQL desde cero: `migration:run` completo sin errores (§3.4).
3. `pnpm --dir dashboard-test build` y `pnpm --dir virtual-device build` — sin errores TS.
4. Cypress (`dashboard-test`) — verde, incluyendo `MeasurementsPage.cy.ts` nuevo.
5. E2E manual mínimo:
   - Grupo con 2 charts + reordenar measurements + limpiar config (§4.1, §4.2).
   - Measurement `dew_point` y `ppm` end-to-end: crear → mandar raw-measurement → chart
     correcto con °C/PPM (§1.3, §4.3).
   - Status on/off tras F5 con reloj del cliente desfasado (§4.4).
   - Soft-delete + recreación de measurement con mismo externalId (§2.1).
   - Flujo virtual-device completo con login y line-stop persistente (§6).
   - Alerta → Node-RED usando `NODE_RED_EVENTS_URL` (§1.6).
6. Seguridad: guards de `/users` activos (§9.9); endpoints `/virtual-device/*` exigen
   permiso (§1.5).
7. `git grep -n "nvarchar\|simple-json\|isMSSQL" backend-receptor/src --" ":!backend-receptor/src/migrations"`
   → sin resultados fuera de migraciones (confirma que no se coló código mssql).

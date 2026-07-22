# Módulo Signals — Documentación técnica

> Última actualización: 2026-07-17. Refleja el estado del código tras el commit
> `9d6b3eb` (paros programados Fases 1 y 2), que es el cambio más reciente que
> tocó el pipeline de signals (método `closeEvent`).

## 1. Qué es y dónde vive

"Signals" es el pipeline de ingestión de la señal física (pulsación de un botón
de la botonera) hasta convertirla en un `Event` de negocio. No es un único
módulo NestJS sino **tres módulos que colaboran**:

| Módulo | Carpeta | Responsabilidad |
|---|---|---|
| `SignalsModule` | `backend-receptor/src/signals/` | Ingesta (`RawSignal`), resolución de catálogo (`ProcessedSignal`) y máquina de estados de `Event` |
| `DeviceSignalsModule` | `backend-receptor/src/device-signals/` | Catálogo CRUD de `DeviceSignal` (botón físico → Device + Department) |
| `VirtualDeviceModule` | `backend-receptor/src/virtual-device/` | Puente HTTP para la app simuladora `virtual-device/`, reusa `SignalService` |

No existen `src/raw-signals/` ni `src/processed-signals/` como módulos
independientes: ambas entidades viven dentro de `src/signals/`.

Pipeline de dominio (ver también `CLAUDE.md` raíz):

```
RawSignal ──► ProcessedSignal ──► DeviceSignal (catálogo) ──► Event ──► AreaDowntime
```

Feature flag: `MODULE_SIGNALS_ENABLED` (env). Config en
`src/config/system-modules.config.ts`:
```ts
[SystemModule.SIGNALS]: (process.env['MODULE_SIGNALS_ENABLED'] || 'true') === 'true'
```
Aplica sobre `SignalController` y `DeviceSignalController` vía
`@SystemModuleTag(SystemModule.SIGNALS)` + el `SystemModuleGuard` global. Si el
flag está en `false`, ambos controllers quedan bloqueados.

---

## 2. Backend — `src/signals/`

```
backend-receptor/src/signals/
├── domain/
│   ├── entities/
│   │   ├── signal.entity.ts              # objeto de dominio efímero, no persistido
│   │   ├── raw-signal.entity.ts          # @Entity('raw_signals')
│   │   └── processed-signal.entity.ts    # @Entity('processed_signals')
│   └── repositories/
│       ├── raw-signal.repository.ts       # RawSignalRepository + DTOs
│       └── processed-signal.repository.ts # ProcessedSignalRepository + DTOs
├── application/
│   ├── dtos/signal.dto.ts                 # SignalDto, VirtualDeviceSignalDto
│   └── services/
│       ├── signal.service.ts              # SignalService — orquestador principal
│       └── signal.service.spec.ts
├── controllers/
│   ├── signal.controller.ts               # /signals
│   └── signal.controller.spec.ts
└── signals.module.ts
```

### 2.1 Entidades

**`RawSignal`** (tabla `raw_signals`) — la pulsación cruda tal cual llega del hardware:

```ts
id: number                // PK autogenerado
externalId: string        // @Column('external_id') — external_id del Device físico
value: string              // valor crudo del botón pulsado (empareja con DeviceSignal.externalValueId)
createdAt: Date
updatedAt: Date
```
Índices en `externalId` y `createdAt`.

> ⚠️ **Gotcha verificado**: `CreateRawSignalDto` (en el repositorio) declara
> también `virtualDevice?`, `reason?`, `comment?`, pero la entidad `RawSignal`
> **no tiene columnas** para ellos. `RawSignalRepository.create()` usa
> `repository.create(dto)` de TypeORM, que solo mapea propiedades que
> correspondan a columnas reales de la entidad — esos tres campos se
> **descartan silenciosamente** y nunca llegan a `raw_signals`. El
> `reason`/`comment`/`virtualDevice` de una señal virtual solo sobrevive en el
> `Event` resultante (vía `EventSignalContext`, ver §2.3), no en el raw signal.

**`ProcessedSignal`** (tabla `processed_signals`) — snapshot desnormalizado de
la resolución Device/DeviceSignal para una señal cruda:
```ts
id: number
deviceId?: number
deviceName?: string
deviceSignalId?: number
deviceSignalName?: string
createdAt: Date
```
Índices: `deviceId`, `deviceSignalId`, `createdAt`.

**`Signal`** (`domain/entities/signal.entity.ts`) — clase de dominio pura, no
mapeada a TypeORM, usada solo para logging interno de `processSignal`. Campos:
`id`, `value`, `createdAt`.

### 2.2 Controller — `SignalController`

`@SystemModuleTag(SystemModule.SIGNALS)`. **Sin `@UseGuards(JwtAuthGuard)`** en
ningún endpoint — es el controller que llama el hardware/la botonera
directamente, no hay sesión de usuario disponible en ese contexto.

| Método | Ruta | Body/Query | Descripción |
|---|---|---|---|
| `POST` | `/signals` | `SignalDto {id, value}` | Entrada del hardware físico. `signalService.processSignal(id, value)` |
| `POST` | `/signals/virtual-device` | `VirtualDeviceSignalDto {id, value, reason?, comment?}` | `signalService.processVirtualDeviceSignal(...)` |
| `GET` | `/signals` | `externalId?, limit=10, offset=0, startDate?, endDate?` | Lista `RawSignal[]` paginado |
| `GET` | `/signals/count` | — | Total de raw signals |
| `GET` | `/signals/:id` | `id: number` | RawSignal por id |
| `GET` | `/signals/external/:externalId` | — | `RawSignal[]` por `externalId` del device |

```ts
// signal.dto.ts
class SignalDto { id: string; value: string }              // ambos requeridos
class VirtualDeviceSignalDto extends SignalDto { reason?: string; comment?: string }
```

> ⚠️ **Nota de seguridad**: al no tener guards, cualquiera con acceso de red al
> backend puede leer el historial completo de señales crudas
> (`GET /signals`, `/signals/:id`, `/signals/external/:id`) sin autenticación.
> Contrasta con `DeviceSignalController`, que sí exige JWT + permisos. Es una
> asimetría intencional para el `POST` (hardware sin sesión) pero probablemente
> no para los `GET` de lectura — vale la pena revisar si deberían protegerse.

### 2.3 Service — `SignalService` (`signals/application/services/signal.service.ts`)

Inyecta: `RawSignalRepository`, `ProcessedSignalRepository`, `DeviceRepository`,
`DeviceSignalRepository`, `TypeOrmEventRepository`, `WebSocketEmitterService`,
`AreaDowntimeService`, `AlertCronService`,
`ScheduledDowntimeCalculatorService`, `EventScheduledDowntimeSliceRepository`,
`DataSource`, y `ModuleRef` (para resolver `AreaTorretaSignalService` de forma
perezosa y evitar un ciclo de dependencias entre módulos).

`EventSignalContext` (tipo interno): `{ virtualDevice?, reason?, comment?, userName? }`
— viaja por todo el flujo de estados del evento para no duplicar lógica entre
señal física y señal virtual.

#### Métodos públicos

| Método | Qué hace |
|---|---|
| `processSignal(id: string, value: string): Promise<RawSignal>` | Flujo hardware. Guarda `RawSignal` → resuelve catálogo → aplica máquina de estados del evento → emite WS `NEW_RAW_SIGNAL`. |
| `processVirtualDeviceSignal(id, value, reason?, comment?, userName?): Promise<RawSignal>` | Igual que arriba, pero marca `virtualDevice: true` en el contexto y propaga `reason`/`comment`/`userName` al `Event`. |
| `getAllSignals(filters?): Promise<{data, total}>` | Lista paginada de `RawSignal`. |
| `getSignalById(id): Promise<RawSignal \| null>` | Uno por id. |
| `getSignalsByExternalId(externalId): Promise<RawSignal[]>` | Por device. |
| `getSignalsCount(): Promise<number>` | Total. |
| `getAllProcessedSignals(filters?)` / `getProcessedSignalsByDeviceId(deviceId)` / `getProcessedSignalsByDeviceSignalId(deviceSignalId)` / `getProcessedSignalsCount()` | Consultas sobre `ProcessedSignal`. **No tienen endpoint expuesto** en `SignalController` — están disponibles a nivel de servicio pero no hay ruta `/signals/processed*` que las use. |

> ⚠️ **Posible debug residual**: `getAllSignals` (línea ~247) emite, en cada
> llamada, un WebSocket `NEW_RAW_SIGNAL` con datos **hardcodeados**
> (`id:'1', externalId:'1', value:'1'`), independientemente de los datos reales
> devueltos. Esto no afecta el resultado HTTP pero infla el tráfico WS con un
> evento falso cada vez que alguien hace `GET /signals`. Candidato a limpiar.

#### Lógica de negocio interna (la parte importante)

**`processSignalWithDeviceRelation(externalId, value)`** — resuelve `Device`
por `externalId`, luego `DeviceSignal` por `(externalValueId=value, deviceId)`
(con fallback a búsqueda global por `externalValueId` si no hay match por
device), y persiste el `ProcessedSignal` desnormalizado con los nombres
resueltos.

**`handleEventLogic(externalId, value, context?)`** — la **máquina de estados
de 3 pulsaciones** del sistema (así lo documenta el propio código):

> `in-progress → close` · `open → in-progress` · `none → new event`

Busca si ya existe un evento `open` o `in-progress` para ese
`(device, deviceSignal)`. Prioridad:
1. Si hay uno **en progreso** → lo cierra.
2. Si no, pero hay uno **abierto** → lo pasa a en progreso.
3. Si no hay ninguno → crea uno nuevo (abierto).

Esto modela el patrón real de la botonera: 1er botón = abre el paro, 2do botón
("en camino"/"atendiendo") = marca en progreso, 3er botón = cierra.

**`createNewEvent(device, deviceSignal, context?)`** — crea el `Event`,
dispara `AreaDowntimeService.handleEventForAreaDowntime(event)`, emite WS
`'new-event'`, y llama
`AreaTorretaSignalService.processEventForAreaTorretas(event)` para actualizar
el color de la torreta física.

**`setEventInProgress(event, context?)`** — actualiza `status`, adjunta
`progressComment` si viene en el contexto (botón 2 de la botonera virtual),
emite WS `'event-updated'`, actualiza torretas.

**`safeCalculateDiscount(areaId, rangeStart, rangeEnd)`** — envoltura segura
sobre `ScheduledDowntimeCalculatorService.getDiscount`; si el cálculo falla,
degrada a "sin descuento" en vez de tumbar el cierre del evento (documentado
como parte de la Fase 2 de paros programados, `BUILD_SPEC_FASE2 §4.3`).

**`toSliceDtos(...)`** — convierte el resultado del cálculo de descuento en
`CreateEventSliceDto[]` para trazabilidad (`event_scheduled_downtime_slices`).

**`closeEvent(event, context?)`** — el método más complejo del módulo:
1. Calcula `durationSeconds` truncando a segundo entero hacia abajo (floor, no
   round — decisión explícita documentada en el código para no sobreestimar
   duración).
2. Si el área tiene paros programados solapados, separa el descuento en dos
   tramos: **RESPONSE** (antes de `inProgressAt`) y **RESOLUTION** (después).
3. Persiste `Event` actualizado + los `EventScheduledDowntimeSlice[]` de
   trazabilidad **en una sola transacción** (`dataSource.transaction`).
4. Emite WS `'closed-event'`.
5. Dispara `AlertCronService.processClosedEvent(event)`.
6. Actualiza torretas vía `AreaTorretaSignalService`.

Este método fue **reescrito en el commit `9d6b3eb`** (feat: paros
programados Fases 1 y 2) para incorporar el descuento y la trazabilidad; antes
de ese commit, `closeEvent` solo calculaba duración y cerraba el evento sin
descontar paros programados.

### 2.4 Repositorios

**`RawSignalRepository`** — `create`, `findAll` (filtros: `externalId`,
`startDate`, `endDate`, `limit`, `offset`), `findById`, `findByExternalId`,
`update`, `delete`, `count`.

**`ProcessedSignalRepository`** — CRUD + filtros por `deviceId`,
`deviceSignalId`, rango de fechas; `countByDeviceId`, `countByDeviceSignalId`.

### 2.5 Module wiring (`signals.module.ts`)

Importa `HttpModule`,
`TypeOrmModule.forFeature([RawSignal, ProcessedSignal, Device, DeviceSignal])`,
`AreaDowntimeModule`, `AlertEscalationModule`, `ScheduledDowntimesModule`.
Exporta `SignalService`, `RawSignalRepository`, `ProcessedSignalRepository` —
por eso `VirtualDeviceModule` puede importar `SignalsModule` e inyectar
`SignalService` directamente sin duplicar lógica.

---

## 3. Backend — `src/device-signals/` (catálogo)

```
backend-receptor/src/device-signals/
├── domain/
│   ├── entities/device-signal.entity.ts
│   └── repositories/device-signal.repository.ts
├── application/
│   ├── dtos/device-signal.dto.ts
│   └── services/device-signal.service.ts
├── controllers/device-signal.controller.ts
└── device-signals.module.ts
```

### 3.1 Entidad — `DeviceSignal` (tabla `device_signals`)

El catálogo central del dominio: liga una botonera (`Device`) + un
`Department` a un botón físico concreto (`externalValueId`).

```ts
id: number
name: string
deviceId: number         // FK → devices
departmentId: number     // FK → departments
externalValueId: string  // valor físico del botón — empareja con RawSignal.value
createdAt / updatedAt / deletedAt   // soft-delete
device?: Device            // @ManyToOne eager
department?: Department    // @ManyToOne eager
```
Índices: `deviceId`, `departmentId`, `externalValueId`. `externalValueId`
**no es único global** — solo debe serlo por `deviceId` (la unicidad global se
quitó en una migración archivada, `RemoveExternalValueIdUniqueConstraint`, para
permitir el mismo valor de botón en distintas botoneras).

### 3.2 Controller — `DeviceSignalController` (`/device-signals`)

`@SystemModuleTag(SystemModule.SIGNALS)` + `@UseGuards(JwtAuthGuard, PermissionGuard)`.
Todos los endpoints requieren permiso `Module.DEVICES` con la acción
correspondiente.

| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `POST` | `/device-signals` | `DEVICES:CREATE` | Crea; valida que Device y Department existan y unicidad `(externalValueId, deviceId)` |
| `GET` | `/device-signals` | `DEVICES:READ` | Lista con filtros `name, deviceId, departmentId, externalValueId, limit, offset, includeDeleted` |
| `GET` | `/device-signals/count` | `DEVICES:READ` | Total |
| `GET` | `/device-signals/device/:deviceId/count` | `DEVICES:READ` | Conteo por device |
| `GET` | `/device-signals/department/:departmentId/count` | `DEVICES:READ` | Conteo por departamento |
| `GET` | `/device-signals/device/:deviceId` | `DEVICES:READ` | `DeviceSignal[]` de un device |
| `GET` | `/device-signals/department/:departmentId` | `DEVICES:READ` | `DeviceSignal[]` de un departamento |
| `GET` | `/device-signals/external/:externalValueId` | `DEVICES:READ` | Uno por `externalValueId` (búsqueda global, sin filtrar por device) |
| `GET` | `/device-signals/:id` | `DEVICES:READ` | Uno por id |
| `PATCH` | `/device-signals/:id` | `DEVICES:UPDATE` | Update parcial; re-valida FK y unicidad si `deviceId`/`externalValueId` cambian |
| `DELETE` | `/device-signals/:id` | `DEVICES:DELETE` | Soft-delete (204) |
| `PATCH` | `/device-signals/:id/restore` | `DEVICES:UPDATE` | Restaura un soft-deleted |

Respuestas de lectura usan
`plainToInstance(DeviceSignalResponseDto, ..., {excludeExtraneousValues: true})`.

```ts
// device-signal.dto.ts
class CreateDeviceSignalDto { name; deviceId: number>0; departmentId: number>0; externalValueId }
class UpdateDeviceSignalDto { name?; deviceId?; departmentId?; externalValueId? }  // todos opcionales
class DeviceSignalResponseDto {
  id, name, deviceId, departmentId, externalValueId, createdAt, updatedAt
  @Exclude() deletedAt
  device?: { id, name, areaId, externalId, area?: { id, name } }
  department?: { id, name }
}
```

### 3.3 Service — `DeviceSignalService`

`create` (valida Device/Department existentes + unicidad de `externalValueId`
por device), `findAll`, `findById` (lanza `NotFoundException`),
`findByExternalValueId`, `findByDeviceId`, `findByDepartmentId`, `update`
(revalida FK y unicidad si cambian), `remove` (soft-delete), `restore`,
`getCount`, `getCountByDeviceId`, `getCountByDepartmentId`.

### 3.4 Repositorio — `DeviceSignalRepository`

Los dos métodos que usa el pipeline de ingestión en tiempo real:
- `findByExternalValueIdAndDeviceId(externalValueId, deviceId)`
- `findByExternalValueId(externalValueId)` (fallback global)

Ambos con `relations: ['device', 'department']` y excluyendo soft-deleted.
Son los que `SignalService.processSignalWithDeviceRelation` y
`handleEventLogic` usan para resolver el catálogo en tiempo real cuando llega
una señal cruda.

### 3.5 Module wiring

`TypeOrmModule.forFeature([DeviceSignal, Device, Department])`,
`PermissionsModule`. Exporta `DeviceSignalService`, `DeviceSignalRepository`.

---

## 4. Backend — `src/virtual-device/` (puente hacia signals)

```
backend-receptor/src/virtual-device/
├── controllers/virtual-device.controller.ts
└── virtual-device.module.ts
```

`VirtualDeviceController` (`/virtual-device`) — `JwtAuthGuard + PermissionGuard`
+ `@RequirePermission(Module.VIRTUAL_DEVICE, Action.CREATE)` a nivel de clase.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/virtual-device/devices` | Lista devices con `isVirtualDevice: true` |
| `GET` | `/virtual-device/devices/:id` | Uno por id |
| `GET` | `/virtual-device/departments` | Catálogo de departamentos |
| `GET` | `/virtual-device/events` | Filtra por `deviceId, deviceSignalId, status` (status admite lista separada por comas) |
| `GET` | `/virtual-device/line-stop/:areaId` | Calcula el inicio real de un paro encadenando eventos activos + cerrados solapados (lógica propia, no delega a `SignalService`) |
| `POST` | `/virtual-device/signals` | El endpoint que consume la app `virtual-device/`. Llama `signalService.processVirtualDeviceSignal(id, value, reason, comment, user.username)` — inyecta el `username` del JWT actual como `userName` del contexto del evento |

Importa `SignalsModule` para inyectar `SignalService` directamente y reutilizar
toda la máquina de estados sin duplicarla.

---

## 5. Integraciones desde el pipeline de signals

### 5.1 WebSocket

`WEBSOCKET_EVENTS` (`src/websocket/constants/websocket-events.constant.ts`):
`NEW_RAW_SIGNAL = 'new_raw_signal'`.

- `WebSocketEmitterService.emitNewRawSignal(signalData)` — envuelve en
  `{type: 'signal', data: signalData}` y emite a todos los clientes.
- `SignalService` además emite eventos **ad-hoc** (sin constante dedicada,
  directo por `webSocketEmitterService.emitToAll(...)`):
  - `'new-event'` — payload `{area, department, status, device, signal}`
  - `'event-updated'` — payload `{eventId, status, area, department}`
  - `'closed-event'` — payload `{eventId, area, department, status, duration}`
- `WebSocketGateway` es un gateway genérico de Socket.IO (CORS `*`); solo
  emite, no tiene `@SubscribeMessage` para escuchar señales entrantes por WS.

### 5.2 Torretas físicas

`AreaTorretaSignalService.processEventForAreaTorretas(event)`
(`src/area-torreta-config/`) — llamado desde `createNewEvent`,
`setEventInProgress` y `closeEvent`. Determina el color según config `AREA` vs
`DEPARTMENT` y hace `POST` HTTP a un endpoint Node-RED con
`{data: [{type:'torreta', torreta, color}]}`. Se resuelve vía `ModuleRef` de
forma perezosa para evitar un ciclo de dependencias con `SignalsModule`.

### 5.3 AreaDowntime, alertas y paros programados

- `AreaDowntimeService.handleEventForAreaDowntime(event)` — se llama en los 3
  puntos del ciclo de vida del evento (crear, en progreso, cerrar). Fusiona
  eventos solapados de la misma área en un solo `AreaDowntime` (ver semántica
  en `CLAUDE.md` raíz).
- `AlertCronService.processClosedEvent(event)` — solo al cerrar.
- `ScheduledDowntimeCalculatorService.getDiscount(areaId, rangeStart, rangeEnd)`
  — solo en `closeEvent`, parte de la feature de paros programados (Fase 2).

---

## 6. Migraciones relacionadas

Baseline consolidado (fuente de verdad actual):
- `1000000000000-BaselineSchema.ts` — DDL de `raw_signals`, `processed_signals`,
  `device_signals` y todo lo demás.
- `1000000000001-SeedInitialData.ts` — semillas iniciales.

Migraciones recientes que tocan el ciclo de vida del evento (consumidas desde
`closeEvent`):
- `1785000000000-CreateScheduledDowntimes.ts`
- `1785000000001-AddScheduledDowntimeSnapshotColumns.ts`
- `1785000000002-AddEventSliceTraceability.ts` — agrega
  `event_scheduled_downtime_slices` y `response_discount_seconds` en `events`
- `1786000000000-AddVirtualEventCommentFields.ts` — agrega campos de
  comentario a eventos virtuales (aquí sí persiste `reason`/`comment`, en
  `events`, no en `raw_signals` — ver gotcha de §2.1)

Archivadas (histórico, no ejecutan — `src/migrations/archive/`):
`CreateDeviceSignalsTable`, `CreateRawSignalsTable`, `CreateProcessedSignalsTable`,
`CreateEventsTable`, `RemoveExternalValueIdUniqueConstraint`,
`CreateAlertEscalationTables`.

---

## 7. Frontend — `dashboard-test/src/`

### 7.1 Rutas

- `config/routes.ts` — entrada `signals` (bajo `/dashboard`), título "Señales
  en Tiempo Real", ícono `PiWaveSineBold`.
- `App.tsx` — ruta real de React Router envuelta en `<AdminProtectedRoute>`.

> ⚠️ **Inconsistencia de patrón**: el resto de rutas del sidebar usa
> `PermissionProtectedRoute` + `ModuleType` (p. ej. `IndustrialDashboard` usa
> `moduleType={ModuleType.SIGNALS}`). La ruta `/dashboard/signals` en cambio
> usa `AdminProtectedRoute`, que exige rol admin en vez de comprobar el
> feature flag/permiso estándar. Si se quiere que usuarios no-admin con
> permiso de signals vean esta pantalla, hay que migrar el patrón.

Segunda pantalla relacionada — gestión del catálogo `DeviceSignal` (no vive en
`/signals` sino en `/dashboard/devices`): **`pages/DevicesPage.tsx`** →
"Dispositivos y Señales", CRUD completo de `DeviceSignal` vía modales.

### 7.2 Página principal — `RawSignalsPage` (`pages/rawSignals.tsx`)

Monitor **en tiempo real vía WebSocket**, no hace polling REST para poblar la
lista:

- Escucha `useWebSocketEvent<WebSocketMessage>("new_raw_signal", handler)` y
  `"new_raw_measurement"`, acumula los últimos 100 registros en estado local
  `signals: RawDataItem[]`.
- Al seleccionar un registro `"signal"`: resuelve `Device` por `externalId`
  (`deviceService.getByExternalId`), luego `DeviceSignal` por
  `(value, externalId)` (`deviceSignalService.getByExternalValueIdAndDeviceExternalId`),
  y calcula `usedDepartments` (deptos ya usados por ese device) para prellenar
  formularios.
- Orquesta 4 flujos de creación in-line desde una señal cruda **sin
  catalogar**: crear `Measurement`, crear `Device`, crear `DeviceSignal`
  (device ya existe), crear `Device + DeviceSignal` juntos.
- Layout `TwoColumnLayout`: header (búsqueda + indicador de conexión WS),
  sidebar `SignalList`, contenido principal `SignalDetail`, footer con botón
  "Limpiar".

> ⚠️ No existe cliente REST para `RawSignal`/`ProcessedSignal` en el frontend
> — toda la pantalla depende 100% del WebSocket. Si el socket se desconecta y
> reconecta, se pierde el historial visible hasta la próxima señal entrante
> (no hay hidratación inicial vía `GET /signals`).

### 7.3 Componentes

- **`components/organisms/signals/SignalList.tsx`** — lista de tarjetas
  (`RawDataItem[]`), distingue visualmente `signal` (púrpura,
  `PiWaveSineBold`) vs `measurement` (azul, `FaRulerCombined`); estado vacío
  con `EmptyState`.
- **`components/organisms/signals/SignalDetail.tsx`** — panel de detalle del
  registro seleccionado. Para `type==='signal'`: dos columnas (Device /
  DeviceSignal), cada una con 3 estados (cargando / encontrado / no
  encontrado con CTA "Agregar"), más el JSON crudo al final. Props:
  `signal, measurement, device, deviceSignal, isLoading*, onClose, onCreate*, formatDate`.

Modales del flujo "descubrir y catalogar" (solo desde `RawSignalsPage`):
- `CreateDeviceAndSignalModal` / `...Form` — crea Device + DeviceSignal juntos
  cuando no existe ninguno.
- `CreateDeviceSignalModal` / `...Form` — crea solo DeviceSignal cuando el
  Device ya existe.
- `CreateDeviceSignalWithDeviceModal` / `...Form` — variante que ya tiene el
  `Device` completo en memoria (evita refetch), recibe `usedDepartments` para
  prevenir duplicados de departamento por device.

Modales del flujo CRUD administrativo (desde `DevicesPage.tsx`):
- `AddSignalModal` — `react-hook-form` + Zod (`createDeviceSignalSchema`);
  campos Nombre del Botón, External Value ID, Departamento. Llama
  `deviceSignalService.create`.
- `EditSignalModal` — mismo patrón con `updateDeviceSignalSchema`, llama
  `deviceSignalService.update(signal.id, {...})`.
- `DeleteSignalModal` — confirmación simple, llama
  `deviceSignalService.delete(signal.id)` (soft-delete).
- `CreateDeviceWithSignalsModal` — crea un Device junto con sus DeviceSignals
  iniciales (botón "Agregar Dispositivo" de `DevicesPage`).

### 7.4 Servicio API y tipos

**`lib/services/device-signal.service.ts`** — clase `DeviceSignalService`,
`baseUrl = "/device-signals"`:
`getAll(filters?)`, `getById(id)`, `getByDeviceId(deviceId)` (envuelve
`getAll`, atrapa errores y devuelve `[]`),
`getByExternalValueIdAndDeviceExternalId(externalValueId, deviceExternalId)`
(resuelve primero el device por external id, luego filtra),
`getByExternalValueId(externalValueId)`, `getCount()`, `create(data)`,
`update(id, data)`, `delete(id)`, `restore(id)`.

**`types/device-signal.ts`**:
```ts
interface DeviceSignal { id, name, deviceId, departmentId, externalValueId, createdAt, updatedAt, deletedAt?, device?, department? }
interface DeviceSignalResponse { message, data: DeviceSignal }
interface DeviceSignalsResponse { message, data: DeviceSignal[], total, pagination }
interface CreateDeviceSignalData { name, deviceId, departmentId, externalValueId }
interface DeviceSignalFilters { name?, deviceId?, departmentId?, externalValueId?, limit?, offset?, includeDeleted? }
```
`RawDataItem` (tipo compartido para signal/measurement crudos) vive junto a
`components/organisms/signals/` (no en `types/`).

Validación Zod (`lib/validations/schemas.ts`): `createDeviceSignalSchema`,
`updateDeviceSignalSchema` — validan `name` no vacío, `deviceId`/`departmentId`
positivos, `externalValueId` no vacío.

### 7.5 WebSocket

- **`contexts/WebSocketContext.tsx`** — provider genérico sobre
  `socket.io-client` (singleton `lib/socket`), expone
  `isConnected, emit, on, off`. Conecta/desconecta a nivel de app.
- **`hooks/useWebSocketEvent.ts`** — `useWebSocketEvent<T>(eventName, callback)`,
  suscribe/desuscribe con cleanup automático. Usado en `rawSignals.tsx` para
  `"new_raw_signal"` y `"new_raw_measurement"`.
- Los eventos `'new-event'`, `'event-updated'`, `'closed-event'` (emitidos por
  `SignalService`) **no** se consumen en los archivos de signals — probablemente
  los escucha `IndustrialDashboard`/`AreaDowntimesPage` (fuera de este módulo).

### 7.6 Feature flag en frontend

**`contexts/PermissionsContext.tsx`**:
```ts
export enum ModuleType { SIGNALS = "signals", MEASUREMENTS = "measurements" }
```
`hasModule(ModuleType.SIGNALS)` se alimenta de `GET /auth/me`
(`modules.signals`, reflejo de `MODULE_SIGNALS_ENABLED`). Se usa en
`PermissionProtectedRoute` para gatear pantallas como `IndustrialDashboard`
— pero, como se indicó en §7.1, la ruta `/dashboard/signals` no pasa por este
mecanismo.

---

## 8. `virtual-device/` — simulador de botonera

Paquete React+Vite independiente con login propio (JWT, `AuthContext`).

**`src/services/api.ts`** (clase `ApiService`):
- `sendSignal(_deviceId, device, deviceSignal)` — `POST /virtual-device/signals`:
  ```ts
  { id: device.externalId, value: deviceSignal.externalValueId }
  ```
- `sendVirtualDeviceSignal(reason, device, deviceSignal, comment?)` — mismo
  endpoint:
  ```ts
  { id: device.externalId, value: deviceSignal.externalValueId, reason, ...(comment && {comment}) }
  ```
  Ambos van al **mismo** endpoint — el backend no distingue por ruta sino por
  los campos presentes (`VirtualDeviceController` siempre llama
  `processVirtualDeviceSignal`, incluso con `reason` vacío).
- Headers: `Authorization: Bearer <VD_TOKEN_KEY>` (localStorage), timeout con
  `AbortController`.

**`hooks/useSignalSender.ts`** — envuelve `sendSignal`/`sendVirtualDeviceSignal`
con estado de loading (`Set<number>` de ids en vuelo) y errores
(`Map<number,string>`) por señal.

**`components/organisms/SignalModal.tsx`** — modal de confirmación antes de
enviar: si `requireReason=true`, exige elegir un motivo de una lista fija
(`falta de material`, `cambio de pieza`, `ingenieria`, `calidad`) + comentario
opcional; si `false`, solo pide comentario (botón 2, "en progreso").

Otros endpoints consumidos: `getVirtualDevices()` →
`/virtual-device/devices?limit=1000`, `getActiveEvent(deviceId, deviceSignalId)`
→ `/virtual-device/events?...&status=open,in-progress`,
`getLineStopForArea(areaId)` → `/virtual-device/line-stop/:areaId`.

---

## 9. Historial reciente relevante

```
9d6b3eb feat(paros-programados): Fases 1 y 2 — catálogo, descuentos, trazabilidad y reportes
4f8c722 feat(reportes): tabla de eventos completa en Excel + ajustes de gráficas
7666fb0 fix(reportes): checkbox de paro programado en filtros + botón exportar al extremo
97982cb fix(reportes): checkbox de paro programado también oculta el segmento en Contabilidad
18ddd84 feat(seed): ejecutable dentro del contenedor + habilita módulo signals
01dca35 fix(seed): renombra dispositivos de Torreta a Botonera
ba5cbb3 feat(seed): agrega script de datos de prueba para el pipeline de señales
222d797 se crean funciones para habilitar o deshabilitar modulo de signals y modulo de measurements
```

El cambio "reciente" más relevante para este módulo específicamente es
`9d6b3eb`: reescribió `SignalService.closeEvent` para descontar tiempo de
paros programados del cálculo de duración de eventos, con trazabilidad vía
`event_scheduled_downtime_slices`. Las capas de controller/DTO/entity de
`signals`/`device-signals` en sí no han cambiado estructuralmente desde
`222d797` (feature flag) y commits anteriores de roles/permisos.

---

## 10. Puntos abiertos / candidatos a limpieza

1. `SignalService.getAllSignals` emite un WS `NEW_RAW_SIGNAL` con datos
   hardcodeados en cada `GET /signals` — parece debug residual.
2. `SignalController` no protege sus endpoints `GET` de lectura (solo el
   `POST` necesita estar abierto para el hardware) — historial de señales
   crudas legible sin autenticación.
3. `/dashboard/signals` usa `AdminProtectedRoute` en vez del patrón estándar
   `PermissionProtectedRoute` + `ModuleType.SIGNALS`.
4. `getAllProcessedSignals`, `getProcessedSignalsByDeviceId`,
   `getProcessedSignalsByDeviceSignalId`, `getProcessedSignalsCount` existen
   en `SignalService` pero no tienen ruta expuesta en `SignalController`.
5. `CreateRawSignalDto.virtualDevice/reason/comment` se declaran pero nunca se
   persisten en `raw_signals` (la entidad no tiene esas columnas) — el
   contexto solo sobrevive en el `Event` resultante.
6. No hay hidratación inicial por REST en `RawSignalsPage`: si el WebSocket se
   reconecta, se pierde el historial visible hasta la siguiente señal.

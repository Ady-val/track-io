# Verificación pendiente y notas de la migración `port/sql-server-improvements`

> Generado durante la ejecución de la spec `MEJORAS_PENDIENTES_PARA_MAIN.md`.
> Rama: `port/sql-server-improvements` (desde `main`).
> Este archivo lista los criterios de aceptación que **no** pudieron verificarse
> automáticamente (requieren BD viva, Node-RED, navegador, etc.) y cualquier
> discrepancia entre la spec y el código real.

## Entorno disponible durante la migración
- Sin BD PostgreSQL corriendo → los criterios "e2e con BD" quedan para verificación manual.
- Sin Node-RED → §1.6 endpoint real no verificable.
- Sin navegador → criterios visuales de frontend no verificables.
- Se ejecuta lo posible: builds, typecheck y tests unitarios.

---

## Criterios pendientes de verificación manual

### §7 Cypress e2e (requiere app + backend + BD corriendo)
- `MeasurementsPage.cy.ts` (nuevo), `AlertsPage.cy.ts`, `commands.ts`, `cypress.config.ts`
  portados verbatim. `tsc --noEmit` del dashboard-test pasa limpio.
- Ejecución (`pnpm cypress run`) pendiente: necesita entorno levantado con PostgreSQL.

### §3.3 / §3.4 Migraciones (requiere BD PostgreSQL viva)
- `pnpm migration:run` desde cero termina sin error y crea columnas
  `chart2_*`, `dashboard_measurement_order (jsonb)` y valores de enum `dew_point`/`ppm`.
- `CreateAdminUser`: sin `ADMIN_USERNAME`/`ADMIN_PASSWORD` → warning y continúa;
  con las vars → usuario creado y login OK; segunda corrida → "ya existe".
- Estado: migraciones nuevas compilan (typecheck limpio); ejecución contra BD pendiente.

---

## Discrepancias spec vs código encontradas

### D1 — `dashboard-measurement.service.spec.ts`: mocks desactualizados en la rama
La rama `sql-server-version-2` NUNCA actualizó este spec al agregar §1.4 (el service
ahora llama `measurementValueRepository.getDatabaseNow()`, `findStatusOffStartTime()` y
`groupRepository.findByIdWithMeasurements()`). En la rama estos 4 tests estaban rotos
(no se corrían o se ignoraban). Para cumplir §12 (tests en verde) agregué al mock:
- `MeasurementValueRepository`: `findStatusOffStartTime` (→ null) y `getDatabaseNow` (→ new Date()).
- `DashboardMeasurementGroupRepository`: `findByIdWithMeasurements` (→ null, cae al fallback ya mockeado).
Cambio solo de test (sin lógica de producto). Resultado: 39/39 verde.
**Recomendación:** aceptar; es el mock mínimo correcto que la rama omitió.

### D4 — 4 suites de tests unitarios de `dashboard-test` que la rama dejó rotas
La rama `sql-server-version-2` **nunca actualizó** estos 4 test files (diff vacío contra
main) pese a reescribir los componentes/hooks que prueban. Quedan 11 tests rojos que
asertan el comportamiento VIEJO, deliberadamente cambiado por el port:

- `components/molecules/__tests__/MeasurementChart.test.tsx` (1)
  - "should render GaugeChart for humidity type" → ahora `humidity` rutea a **LiquidFillGauge**
    (§4.3), no GaugeChart. El test no mockea LiquidFillGauge/DewPointDonutChart.
- `components/molecules/__tests__/StatusIndicatorCard.test.tsx` (1)
  - "should display duration when status is ON and onStartTime is provided" → la tarjeta
    ahora usa `useDurationTicker`+`statusDurationSeconds` (§4.7), no `onStartTime`.
- `hooks/__tests__/useRealtimeMeasurementValues.test.ts` (7)
  - `initializeValue` cambió de firma (ahora acepta offStartTime/statusDurationSeconds y
    **siempre prioriza backend**, §4.7); los tests asertan el contrato viejo
    (ej. "should not overwrite existing value" ya no aplica).
- `hooks/__tests__/useStatusDuration.test.ts` (2)
  - "onStartTime in the future" y "invalid date string": la reescritura usa `getServerNow()`
    y confía en el flag activo aunque el startTime sea futuro (§4.4).

**Estado del build:** `tsc --noEmit` de dashboard-test pasa limpio; el resto de la suite
(380 tests) pasa. Solo estos 11 fallan.

**Fuera de scope:** §7 limita el testing frontend portado a Cypress; estos unit tests no
estaban en la spec y la rama los shipeó rotos. No los reescribí para no "improvisar"
expectativas (instrucción #8), especialmente en la lógica de tiempo servidor.

**⚠️ Posible bug latente detectado (revisar):** el `useStatusDuration` reescrito devuelve
`"NaN:NaN:NaN"` ante un `startTime` con fecha inválida (antes devolvía `"00:00:00"`),
porque `parseUTCTimestamp` propaga `NaN` sin sanitizar. Impacto bajo (la tarjeta ya usa
`useDurationTicker`, no este hook), pero conviene añadir un guard `Number.isNaN` en
`useStatusDuration.ts` si el hook sigue en uso en algún punto.

**Recomendación:** actualizar los 4 test files al nuevo contrato (fix mecánico y acotado
para MeasurementChart/StatusIndicatorCard; los hooks requieren revisar la lógica de tiempo)
y evaluar el guard NaN. No bloquea build ni deploy.

### D5 — §8 Docker: los artefactos de virtual-device de la rama estaban DESHABILITADOS
Al portar §8 descubrí que la spec no coincide con la realidad de la rama:
- `docker/Dockerfile.virtual-device` de la rama tiene **todo el Stage 1 (build) comentado**
  y solo genera un placeholder ("Virtual device no está desplegado en este entorno").
- `docker/Dockerfile.unified` de la rama también sirve el virtual-device como **placeholder**
  (era el deploy de Leoni, que lo comentó — commit 3672cf6).
- `nginx.virtual-device.conf` es para un contenedor standalone que el compose no define.

Copiarlos "verbatim" (como decía §8 literal) habría dado a main un virtual-device
**no funcional**, contradiciendo la decisión §0.2 (activo por defecto).

**Qué hice en su lugar** (para honrar §0.2 con el patrón probado de main, sin improvisar
diseño nuevo):
- Extendí el `Dockerfile.unified` **limpio de main** con una etapa real
  `virtual-device-builder` que replica exactamente la etapa del dashboard (pnpm install +
  vite build) y copia el dist a `/usr/share/nginx/html/virtual-device`.
- Agregué `location /virtual-device/` a `docker/nginx.conf` (mantengo `proxy_pass` a
  `track_io_backend`, que resuelve igual que `backend`).
- Agregué `extra_hosts` + `NODE_RED_EVENTS_URL` al backend en `docker-compose.yml`.
- **NO copié** el `Dockerfile.virtual-device` ni el `nginx.virtual-device.conf` de la rama
  (placeholders deshabilitados / archivos huérfanos no referenciados por el compose).

**Verificado:** `docker compose config` válido; `vite build` del virtual-device produce
`dist` con base `/virtual-device/` correcta (assets prefijados).
**Pendiente (requiere Docker daemon + red):** `docker compose build` y `up` completos para
confirmar que la imagen unified sirve dashboard + virtual-device y hace login contra el
backend. `vite.config.ts` del virtual-device ya trae `base: "/virtual-device/"`.
**Recomendación:** aceptar el enfoque unified; validar con un build/up real antes de release.

### D3 — `raw-measurement.service.spec.ts`: aserción del método viejo
La rama tampoco actualizó este spec al cambiar el service a
`getActiveMeasurementByExternalId` (§2.1). El test asertaba/mockeaba
`getMeasurementByExternalId` y fallaba. Renombré las 6 ocurrencias al método nuevo
(mock + aserciones). Cambio solo de test. Resultado: 11/11 verde.
**Recomendación:** aceptar.

### D2 — `tsc --noEmit` sobre `*.spec.ts` reporta errores pre-existentes
`exactOptionalPropertyTypes: true` hace que `tsc --noEmit` sobre el proyecto completo
marque errores en varios `*.spec.ts` (mocks que pasan `null`/parciales). Estos errores
YA existían en `main` antes de la migración, el build (`tsconfig.build.json`) excluye
`**/*spec.ts`, y jest (ts-jest) los tolera. No bloquean build ni tests. No se tocan.

---

## Resultado del checklist §12

| # | Ítem | Resultado |
|---|------|-----------|
| 1 | `nest build` + `jest` backend | ✅ build limpio; **957/957** tests, 68/68 suites |
| 2 | `migration:run` desde cero (BD PG) | ⏳ PENDIENTE (sin BD); migraciones compilan (typecheck) |
| 3 | build dashboard-test y virtual-device | ✅ ambos `tsc --noEmit` limpio + `vite build` OK |
| 4 | Cypress e2e | ⏳ PENDIENTE (requiere app+backend+BD); archivos portados, tsc limpio |
| 5 | E2E manual (2 charts, dew_point/ppm, status F5, soft-delete, virtual-device, Node-RED) | ⏳ PENDIENTE (requiere entorno) |
| 6 | Seguridad: guards `/users` activos; `/virtual-device/*` exige permiso | ✅ verificado (user.controller línea 35 activo; controller VD con UseGuards+RequirePermission) |
| 7 | `git grep nvarchar\|simple-json\|isMSSQL` fuera de migraciones | ✅ SIN RESULTADOS |

### Tests unitarios frontend (fuera del checklist estricto)
- dashboard-test jest: 380 pasan; **11 fallan** en 4 suites que la rama dejó rotas (ver D4).
  No bloquean build ni deploy. Requieren actualización al nuevo contrato.

### Resumen de pendientes que requieren entorno (BD/Docker/navegador)
- §3.4 `migration:run` contra PostgreSQL.
- §7 Cypress e2e.
- §12.5 flujo e2e manual.
- D5 `docker compose build`/`up` completo del unified con virtual-device.
- D4 actualización de 4 suites de tests unitarios frontend + revisar guard NaN de useStatusDuration.

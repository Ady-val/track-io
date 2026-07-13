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

_(se completa al final)_

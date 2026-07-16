# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es Track.IO

Sistema de **andon / seguimiento de paros de línea** para piso de planta. En cada
línea de producción hay una **botonera** (dispositivo físico con botones); cuando
la línea se detiene, el operario presiona el botón del departamento que necesita
(Mantenimiento, Ingeniería, Materiales, Calidad). Eso genera un **Event** (paro)
que el sistema registra, contra el que se mide el **tiempo que el área estuvo
detenida** (`AreaDowntime`), y que dispara **alertas/escalaciones** y el color de
las **torretas** (semáforos de piso).

## Estructura del repositorio (monorepo sin workspace)

Tres paquetes **independientes** (cada uno con su `package.json` y su
`pnpm-lock.yaml`; **no** hay workspace raíz que los una), más orquestación:

| Carpeta | Qué es | Stack |
|---|---|---|
| `backend-receptor/` | API + lógica de negocio + WebSocket | NestJS 11, TypeORM 0.3, PostgreSQL, pnpm |
| `dashboard-test/` | Dashboard de operación (el frontend principal) | React 19 + Vite, HeroUI, TanStack Query, socket.io-client |
| `virtual-device/` | Simulador de una botonera (para pruebas/demo) | React + Vite, HeroUI |
| `docker/` | Orquestación de todo el stack (compose, Dockerfiles, nginx) | — |
| `database/` | Compose standalone de Postgres para desarrollo aislado | — |
| `documentation/` | Análisis funcional, checklists de tests, guía E2E | — |

El grueso del trabajo de features nuevas ocurre en `backend-receptor/` y
`dashboard-test/`. Ver `backend-receptor/CLAUDE.md` para las convenciones del backend.

## Modelo de dominio y pipeline de señales

Cadena de datos (de la señal cruda al reporte de negocio):

```
RawSignal ──► ProcessedSignal ──► DeviceSignal (catálogo) ──► Event ──► AreaDowntime
                                        ▲                        │
   Area ──► Device (botonera) ──────────┘        Department ─────┘
```

- **Area** (`areas`): una línea de producción.
- **Device** (`devices`): la **botonera** de un área (`area_id`). El campo
  `external_id` es el identificador físico. `is_virtual_device` marca las del simulador.
- **DeviceSignal** (`device_signals`): catálogo que liga una botonera + un
  **Department** a un botón concreto (`external_value_id`). Es el "tipo de paro".
- **Event** (`events`): un paro real. Guarda snapshots desnormalizados
  (`area_name`, `department_name`, etc.) + `status` (`open` → `in-progress` →
  `closed`) y tiempos (`created_at`, `in_progress_at`, `closed_at`, `duration_seconds`).
- **AreaDowntime** (`area_downtimes` + `area_downtime_events`): **el tiempo real
  que un área estuvo detenida**. Lógica clave en
  `src/area-downtime/application/services/area-downtime.service.ts`:
  varios eventos **solapados** de la misma área se **fusionan en un solo
  downtime** — `start_at` = inicio del primer evento, `ends_at` = cierre del
  **último** evento en cerrar. No es la suma de los paros por separado. Al
  agregar features que toquen eventos, respetar esta semántica de fusión.

No existe un modelo `Signal`/`SignalType` con enums: el concepto "señal" se
expresa vía `DeviceSignal` + las tablas de ingestión `raw_signals`/`processed_signals`.

## Comandos

### Backend (`cd backend-receptor`, usa **pnpm**)
```bash
pnpm install
pnpm run start:dev            # NestJS en watch (synchronize ON en dev, no requiere migraciones)
pnpm run build                # nest build → dist/
pnpm run lint:check           # eslint sin auto-fix (lint aplica --fix)
pnpm test                     # jest (todos)
pnpm test -- events           # un solo archivo/patrón: por ruta o nombre
pnpm run test:unit            # solo *.spec.ts
pnpm run migration:generate -- src/migrations/NombreMigracion   # generar desde entidades
pnpm run migration:run        # aplicar migraciones (usa src/data-source.ts)
pnpm run migration:revert
pnpm run db:start / db:stop   # Postgres de dev vía docker
```

### Frontends (`cd dashboard-test` o `virtual-device`)
```bash
pnpm run dev                  # Vite dev server
pnpm run build                # tsc && vite build
pnpm run type-check           # tsc --noEmit  (solo dashboard-test)
pnpm run lint:check
pnpm test                     # jest (solo dashboard-test)
pnpm run test:e2e             # Cypress (solo dashboard-test)
pnpm run cypress:run:devices  # un solo spec de Cypress
```

### Stack completo con Docker (`cd docker`)
```bash
docker compose up -d --build  # build + migraciones automáticas al arrancar + gateway
docker compose logs -f backend
docker compose exec backend node dist/seed/seed-test-data.js   # cargar datos de prueba
docker compose down           # (down -v para borrar también el volumen de datos)
```

## Orquestación Docker (cómo se levanta en un server)

`docker/docker-compose.yml` define 3 servicios y **un solo comando** los levanta
en orden vía healthchecks: **postgres (healthy) → backend (healthy) → nginx**.

- **backend**: corre las **migraciones al arrancar** con el data-source
  **compilado** (`node dist/data-source.js migration:run`), luego `node dist/main.js`.
  Publica `:3000`. La semilla base (permisos, grupos, colores, usuario ADMIN)
  la crean las migraciones `SeedInitialData` y `CreateAdminUser`.
- **nginx** (gateway, `:80`): compila y sirve ambos frontends como estáticos y
  hace reverse proxy de `/api` y `/socket.io` al backend. Los frontends son
  **origin-relative** (usan rutas relativas al mismo origen), así que **el mismo
  build funciona en cualquier IP/dominio sin reconstruir**.
- `docker/.env` está commiteado con los defaults (incluye los feature flags de
  módulos). Las contraseñas ahí son de demo.

## Convenciones importantes

- **Feature flags de módulos**: `MODULE_SIGNALS_ENABLED` y
  `MODULE_MEASUREMENTS_ENABLED` (env). Un controller se marca con
  `@SystemModuleTag(SystemModule.X)` y el `SystemModuleGuard` global
  (`APP_GUARD` en `app.module.ts`) bloquea sus rutas si el módulo está apagado.
  El frontend también oculta módulos apagados en el sidebar.
- **Auth**: JWT **por-controller** con `@UseGuards(JwtAuthGuard)` (no es global).
  El usuario ADMIN inicial se siembra por migración desde `ADMIN_USERNAME` /
  `ADMIN_PASSWORD`.
- **Migraciones**: en dev/test `synchronize` está **ON** (no necesitas correr
  migraciones); en producción está **OFF** y las migraciones son la fuente de
  verdad. Hay un **baseline consolidado** (`1000000000000-BaselineSchema`); las
  migraciones anteriores están en `src/migrations/archive/`. Genera nuevas con
  `migration:generate` a partir de cambios en las entidades.
- **Datos de prueba**: `src/seed/seed-test-data.ts` (compilado a
  `dist/seed/seed-test-data.js`) siembra ~2 meses de eventos/paros con fechas
  dinámicas relativas a hoy, incluyendo casos de eventos solapados. Idempotente.

## Gotchas en Windows / Git Bash

- **Path mangling de MSYS**: `docker run -v "$(pwd)/x":/app -w /app` en Git Bash
  convierte `/app` a una ruta Windows y **falla** (crea carpetas basura tipo
  `x;C`). Prefija con `MSYS_NO_PATHCONV=1` los `docker run` con montajes.
- Los builds Docker usan `pnpm install --frozen-lockfile`: si un `pnpm-lock.yaml`
  se desincroniza de su `package.json`, el build **revienta**. Mantenerlos en sync.

## Documentación adicional

- `documentation/ANALISIS_APLICACION.md` — análisis funcional del dashboard.
- `documentation/MODULOS_SIDEBAR.md` — módulos/pantallas del frontend.
- `documentation/TESTING_E2E.md` — guía de Cypress.
- `docker/README.md` — instalación y operación del stack.
- `backend-receptor/README.md` + `backend-receptor/docs/` — colección Postman de la API.

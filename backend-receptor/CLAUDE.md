# CLAUDE.md — backend-receptor

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Contexto general del proyecto y del modelo de dominio: ver `../CLAUDE.md`.
Este archivo cubre las convenciones internas del backend (NestJS + TypeORM).

## Arquitectura por módulo (DDD ligero)

Cada dominio vive en `src/<modulo>/` con esta estructura en capas:

```
src/<modulo>/
├── domain/
│   ├── entities/            # entidades TypeORM (@Entity) — el modelo de datos
│   └── repositories/
│       ├── <x>.repository.ts          # INTERFAZ + DTOs (CreateXDto, XFilters)
│       └── typeorm-<x>.repository.ts   # implementación TypeORM de esa interfaz
├── application/
│   ├── services/            # lógica de negocio (*.service.ts + *.service.spec.ts)
│   ├── dtos/                # DTOs de request/response con class-validator
│   └── mappers/ | types/    # (según el módulo) transformaciones/tipos
├── controllers/             # *.controller.ts (+ *.controller.spec.ts)
└── <modulo>.module.ts       # wiring: forFeature([Entity]) + providers + exports
```

Ejemplo mínimo (`src/events/events.module.ts`): importa
`TypeOrmModule.forFeature([Event])`, declara el controller, y provee **y exporta**
`TypeOrmEventRepository`. Los repos se **exportan** para que otros módulos los
inyecten (p. ej. `AreaDowntimeService` inyecta el repo de eventos).

### Patrón de repositorio

- La **interfaz** (`<x>.repository.ts`) define el contrato + los DTOs de entrada
  (`CreateXDto`, `XFilters`). Es `import type` — sin runtime.
- La **implementación** (`typeorm-<x>.repository.ts`) es la clase `@Injectable`
  que se registra como provider. Los servicios inyectan la clase TypeOrm concreta.
- Al añadir un módulo nuevo: crea entidad → interfaz+DTOs → impl TypeORM →
  servicio → controller → module (con `forFeature`, `providers`, `exports`).

## Entidades y base de datos

- Tablas y columnas en **snake_case** vía `name:` explícito; propiedades en
  camelCase. Timestamps con `@CreateDateColumn`/`@UpdateDateColumn` y
  **soft-delete** con `@DeleteDateColumn` (`deleted_at`) en catálogos.
- Los **eventos guardan snapshots desnormalizados** (`area_name`,
  `department_name`, `device_name`, `device_signal_name`) además de los FKs, para
  preservar el histórico aunque cambie el catálogo. Al crear/actualizar eventos,
  poblar ambos.
- `synchronize` está **ON** en dev/test y **OFF** en prod. En prod las
  **migraciones** son la fuente de verdad y corren al arrancar el contenedor.

## Migraciones (TypeORM CLI)

Usan `src/data-source.ts` (Postgres, lee env, `synchronize: false`).

```bash
pnpm run migration:generate -- src/migrations/DescribeCambio   # diff entidades → migración
pnpm run migration:run
pnpm run migration:revert
pnpm run migration:show
```

- Existe un **baseline consolidado** `1000000000000-BaselineSchema` con todo el
  DDL; las históricas quedaron en `src/migrations/archive/` (no se ejecutan).
- Los datos semilla críticos van como migración aparte
  (`1000000000001-SeedInitialData`, `9999999999999-CreateAdminUser`) e **idempotente**
  (`ON CONFLICT DO NOTHING` / check-before-insert). Sigue ese patrón para semillas nuevas.

## Seguridad y feature flags

- `@SystemModuleTag(SystemModule.SIGNALS | MEASUREMENTS)` sobre un controller lo
  pone detrás del `SystemModuleGuard` global; si `MODULE_X_ENABLED=false` sus
  rutas responden bloqueadas. Config en `src/config/system-modules.config.ts`.
- Auth por JWT **por-controller** con `@UseGuards(JwtAuthGuard)` (no global).
- Permisos: el usuario `ADMIN` recibe **todos** los permisos existentes en la
  tabla `permissions` (ver `ADMIN_USERNAME` en `user.service.ts`). Si agregas un
  módulo nuevo al dashboard, añade sus permisos a la lista de módulos de
  `SeedInitialData` o el admin no verá esa pantalla.

## Tests

- **Jest**, tests unitarios junto al código (`*.spec.ts`).
```bash
pnpm test                    # todos
pnpm test -- events          # por patrón (ruta o nombre de describe)
pnpm run test:unit           # solo *.spec.ts
pnpm run test:cov            # con cobertura
```
- Los servicios se testean con repos mockeados; ver cualquier `*.service.spec.ts`
  del módulo como plantilla.

## TypeScript

`tsconfig.json` es **muy estricto** (`exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`,
`noUnusedLocals/Parameters`, etc.). Implicaciones frecuentes:
- Accede a env con corchetes: `process.env['DATABASE_HOST']`.
- Con `noUncheckedIndexedAccess`, indexar arrays/mapas da `T | undefined`: usa
  `!` sólo cuando el invariante lo garantiza, o comprueba antes.
- Objetos parciales opcionales: no asignes `undefined` explícito a props opcionales.

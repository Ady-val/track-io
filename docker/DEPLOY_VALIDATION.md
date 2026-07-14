# Validación del rediseño de contenedores (Fase 6)

Rama: `feat/frontend-origin-relative-api`. Fecha: 2026-07-14.

## Comando único
```bash
docker compose -f docker/docker-compose.yml up -d --build
```
Levanta 3 servicios: **db** (postgres) → **backend** (NestJS, migraciones al arrancar) →
**gateway** (nginx: sirve ambos frontends + proxy `/api` y `/socket.io`). Orden por
healthchecks (db-healthy → backend-healthy → gateway).

## Validado ✅ (con componentes reales, offline)
- **Migraciones desde cero** contra postgres limpio: baseline completo (32 tablas, enums,
  FKs, constraints) + índice parcial + seeds. `migration:run` **EXIT=0**, idempotente
  ("No migrations are pending"). Data-source **compilado** (sin ts-node), igual que en la
  imagen de producción.
- **Backend en modo producción** (synchronize OFF) contra la BD migrada: arranca y responde
  `GET /health` → `{"status":"ok"}` 200.
- **Gateway nginx real** (imagen `nginx:alpine` + `docker/nginx.conf` + los dist compilados):
  - `GET /` → dashboard (`<title>TrackIQ</title>`) 200.
  - `GET /virtual-device/` → 200, assets con base `/virtual-device/`.
  - `GET /api/health` → proxy al backend → 200.
  - `GET /socket.io/?EIO=4&transport=polling` → handshake 200 (proxy WebSocket OK).
  - `POST /api/auth/login` (admin sembrado ADMIN/Admin123!) → **JWT + user**, 200.
- **Frontend origin-relative**: con `VITE_API_URL` vacío el bundle no contiene `localhost:3000`
  y usa `/api` + mismo origen para WS.
- **Backend**: `nest build` OK, **957/957 tests**. Ambos frontends `tsc` + `vite build` OK.
- `docker compose config` válido.

## Pendiente ⏳ (requiere red sin interceptación TLS)
- `docker compose up -d --build` **completo** (construir las imágenes propias): en este
  entorno el proxy de Docker Desktop intercepta TLS y `apk`/`pnpm`/`npm` no pueden bajar
  paquetes. Toda la lógica/config está validada con componentes reales; solo falta ejecutar
  el build de imágenes en una red sana.

## Nota
- `docker/.env` (versionado) trae credenciales por defecto de desarrollo; cambiar en prod.

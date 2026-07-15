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

## `docker compose up -d --build` completo ✅ (validado end-to-end)
Tras desactivar el escaneo HTTPS de Avast (hacía MITM de TLS y los contenedores rechazaban
el certificado), el build y el arranque completos funcionan:
- Imágenes construidas: `docker-backend` (269MB, multi-stage) y `docker-nginx`/gateway (65MB).
- 3 servicios **healthy** (postgres → backend → gateway) con el orden por healthchecks.
- Vía gateway (:80): dashboard `/`, `/virtual-device/`, `/api/health`, `/socket.io/`
  handshake, y `POST /api/auth/login` con el admin sembrado → **JWT + user**.
- Backend directo en el puerto publicado → `/health` 200 (acceso para servicios externos).

## Notas operativas (importantes)
1. **Interceptación TLS (Avast):** si el build falla con "certificate verify failed" al bajar
   paquetes, desactivar el análisis HTTPS de Avast (o excluir `registry.npmjs.org`,
   `dl-cdn.alpinelinux.org`, `github.com`) y reintentar.
2. **Volumen de datos viejo:** si existe un volumen `*_postgres_data` de un despliegue
   ANTERIOR a la consolidación del baseline, las migraciones fallarán con `42P07`
   (relación ya existe), porque la tabla `migrations` tiene los nombres antiguos. Para una
   instalación **nueva** usar un volumen limpio (`docker compose down -v`, ⚠️ borra datos).
   Para migrar un despliegue **existente** hay que reconciliar la tabla `migrations`
   (marcar el baseline como aplicado) — no basta `migration:run`.
3. **Puerto 3000:** el backend publica `3000` para servicios externos. Si el host ya usa
   3000, liberar ese puerto o remapear el publish en el compose.
4. `docker/.env` (versionado) trae credenciales por defecto de desarrollo; cambiar en prod.

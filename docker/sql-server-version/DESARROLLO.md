# Entorno de desarrollo Docker (SQL Server)

Este documento resume cómo está organizado el arranque en **desarrollo** cuando usas `run.sh` y los Dockerfiles del repositorio. Complementa el [README.md](./README.md) con detalle de flujo y construcción de imágenes.

**Guía paso a paso (recomendada):** [RUN_DEV.md](./RUN_DEV.md)

## Rol de `run.sh` en desarrollo

El script vive en este directorio y debe ejecutarse desde aquí (`cd docker/sql-server-version`). Comandos:

```bash
./run.sh dev                  # pnpm install + build + Docker (requiere internet la primera vez)
./run.sh dev --skip-install   # omite pnpm install (offline si ya hay node_modules)
```

### Secuencia que ejecuta `do_dev`

1. **`.env`**: Si no existe `.env` pero sí `env.example`, copia la plantilla a `.env`.
2. **`source .env`**: Carga variables del archivo; si defines **`HOST_IP`** ahí, se usa como IP del servidor antes de la detección automática.
3. **IP del host** (`detect_host_ip`): Si `HOST_IP` sigue vacío, intenta detectar la IP LAN en Linux (`ip`, `hostname -I`, etc.); si no hay nada usable, usa `localhost`. También puedes forzar con `HOST_IP=192.168.x.x ./run.sh dev` en la misma línea de comando.
4. **`.env.host`**: Se regenera siempre con `HOST_IP` y `VITE_API_URL=http://<HOST_IP>:3000` para Compose.
5. **`pnpm install --frozen-lockfile`** (salvo `--skip-install`): en `backend-receptor` y `dashboard-test` (ruta raíz del repo: dos niveles arriba de este directorio). Requiere **internet** salvo que uses `--skip-install`.
6. **`pnpm build`**: backend → `backend-receptor/dist/`; frontend con `VITE_API_URL=http://<HOST_IP>:3000` → `dashboard-test/dist/` (URL bakeada en el bundle Vite).
7. **Docker**: `docker compose ... down -v` y luego `build` + `up -d` (sin `--no-cache`; Docker invalida capas si cambian los `dist/`).
8. **`down -v`**: Elimina volúmenes nombrados del compose de dev (incluido `sqlserver_data`); la base de datos de desarrollo queda vacía en cada ciclo completo.

### URLs al terminar

El script muestra **Dashboard** `http://<HOST_IP>:80` y **Backend** `http://<HOST_IP>:3000` (y `localhost` en la misma máquina). El SQL Server del compose escucha en el host en el puerto **1434** (mapeado al 1433 del contenedor).

### Fases online / offline

| Fase | ¿Internet? |
|------|------------|
| `pnpm install` | Sí |
| `pnpm build` | No |
| `docker compose build` / `up` | Solo si faltan capas o imágenes base en caché (`node:18-alpine`, `nginx:alpine`, SQL Server) |

---

## Qué levanta `docker-compose.yml` (desarrollo)

Tres servicios en la red bridge `track_io_network`:

| Servicio | Imagen / build | Función |
|----------|----------------|---------|
| `track_io_sql_server` | `mcr.microsoft.com/mssql/server:2022-latest` | SQL Server 2022, edición Developer, volumen `sqlserver_data`, healthcheck con `sqlcmd`. |
| `backend` | Build con `docker/Dockerfile.backend` | API Node (puerto 3000). Espera a que SQL esté healthy. |
| `nginx` | Build con `docker/Dockerfile.unified` | Sirve el dashboard estático y hace proxy de `/api/` al servicio `backend`. Puerto 80. |

Variables clave del backend en compose: `DATABASE_*` apuntan al hostname Docker `track_io_sql_server`, puerto interno 1433, usuario `sa` y contraseña desde `MSSQL_SA_PASSWORD` del `.env`. `CORS_ORIGIN` en dev está en `*`.

---

## Dockerfiles usados en dev

Ambos están bajo `docker/` (rutas relativas al repo desde el contexto de build definido en compose).

### `Dockerfile.backend` (`backend-receptor`)

- Base: `node:18-alpine`.
- **Modo “offline”**: no instala dependencias dentro de la imagen; **copia `node_modules/`, `dist/`, `scripts/` y `package.json`** desde el contexto `../../backend-receptor`.
- **Implicación**: En la máquina host debes haber ejecutado algo equivalente a `pnpm install` (o npm) y **compilar** el backend (`dist/`) antes de que `docker compose build` tenga éxito.

El `command` en `docker-compose.yml` (no el `CMD` por defecto del Dockerfile) arranca:

1. `node scripts/ensure-mssql-database.js`
2. `node scripts/run-migrations-docker.js`
3. `node --experimental-global-webcrypto dist/main.js`

### `Dockerfile.unified` (dashboard + nginx)

- Base: `nginx:alpine`.
- Copia `docker/nginx.conf` y el **contenido ya construido** `dashboard-test/dist/` al árbol de nginx bajo `/usr/share/nginx/html/dashboard/`.
- Crea un `index.html` mínimo para `/virtual-device/` (placeholder si no hay build del virtual device en esta imagen).

**Implicación**: Debes haber generado `dashboard-test/dist/` en el host (por ejemplo `pnpm build` en `dashboard-test`) antes del build de la imagen nginx.

### Vite y URL del API

La URL del API en el bundle del dashboard es la que quedó en **`pnpm build`** del host (`VITE_API_URL` la inyecta `run.sh` al compilar). El servicio **nginx** en `docker-compose.yml` no usa `build args` para Vite; `Dockerfile.unified` solo copia `dashboard-test/dist/`. Para cambiar la IP/origen del API hay que ajustar `HOST_IP` en `.env` (o override) y volver a ejecutar `./run.sh dev` (al menos la parte build + Docker).

---

## Cómo encaja Nginx con el backend

En `docker/nginx.conf`, las peticiones a `/api/` se envían a `http://backend:3000/` (nombre del servicio en la red de Compose). El dashboard puede usar rutas relativas bajo `/api/` sin depender de `VITE_API_URL`; si el código del front usa URL absoluta, debe coincidir con lo compilado en `dist/` o con el uso del proxy.

---

## Resumen operativo para un desarrollador

1. Seguir la guía **[RUN_DEV.md](./RUN_DEV.md)** (Linux): `.env` con `MSSQL_SA_PASSWORD` y `HOST_IP`, luego `./run.sh dev`.
2. En una sola ejecución, `run.sh` corre `pnpm install`, `pnpm build` en backend y frontend, y levanta Docker con los `dist/` generados.
3. **`./run.sh dev` usa `down -v`**: borra el volumen de SQL de desarrollo en cada arranque completo; las migraciones se vuelven a aplicar al iniciar el backend.
4. Sin red (deps ya instaladas): `./run.sh dev --skip-install`.

En **Windows** el flujo equivalente sigue siendo `run.bat dev` (puede no incluir aún los mismos pasos de pnpm que `run.sh`; revisa ese script si lo usas).

Para apagar desarrollo: `./run.sh down` (por defecto entorno `dev`).

---

## Referencia rápida de archivos

| Archivo | Uso en dev |
|---------|------------|
| `RUN_DEV.md` | Guía rápida para levantar el stack |
| `run.sh` | Orquestación: `.env`, IP, pnpm install/build, `.env.host`, compose build/up |
| `docker-compose.yml` | Definición de SQL Server + backend + nginx |
| `env.example` | Plantilla de `.env` |
| `../Dockerfile.backend` | Imagen del backend (artefactos precompilados) |
| `../Dockerfile.unified` | Imagen nginx + estáticos del dashboard |
| `../nginx.conf` | Rutas `/`, `/virtual-device/`, proxy `/api/` |

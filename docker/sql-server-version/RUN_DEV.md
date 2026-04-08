# Cómo levantar el proyecto en desarrollo (Linux)

Guía corta para desplegar Track.IO con Docker y SQL Server. Sigue los pasos en orden.

## Requisitos previos

- **Docker** y **Docker Compose** instalados y en marcha.
- **pnpm** instalado, por ejemplo: `npm install -g pnpm`
- **Conexión a internet** al ejecutar el paso 2 (descarga de paquetes e imágenes Docker la primera vez).

---

## Paso 1 — Variables de entorno

1. Abre una terminal y entra en esta carpeta del proyecto:

   ```bash
   cd docker/sql-server-version
   ```

2. Crea el archivo `.env` a partir del ejemplo (solo la primera vez):

   ```bash
   cp env.example .env
   ```

3. Abre el archivo **`.env`** con tu editor y configura **exactamente** estas líneas (están en el mismo archivo):

   | Variable | Dónde está en `.env` | Qué poner |
   |----------|----------------------|-----------|
   | `MSSQL_SA_PASSWORD` | Bloque *SQL Server Configuration* (cerca del inicio) | Una contraseña segura para SQL Server. **No uses** los caracteres `@` ni `#`. |
   | `HOST_IP` | Bloque antes de *Frontend* (comentarios sobre “IP del servidor en la red local”) | La IP de **esta máquina** en tu red local, por ejemplo `192.168.1.50`. Así otros equipos sabrán a qué IP apuntar para el dashboard y el API. |

   Debes repetir la misma contraseña en las variables que en `env.example` ya vienen alineadas con ella, por ejemplo `DATABASE_PASSWORD` y el fragmento de contraseña dentro de `DATABASE_URL`, para que coincidan con `MSSQL_SA_PASSWORD`.

4. Guarda el archivo `.env`.

**Cómo saber tu IP en Linux:** `ip -4 addr` o `hostname -I` (elige la IP de tu red LAN, no `127.0.0.1`).

---

## Paso 2 — Instalar dependencias, compilar y levantar contenedores

Con **internet activo**, desde la misma carpeta `docker/sql-server-version` ejecuta:

```bash
./run.sh dev
```

Ese comando hace, en este orden:

1. `pnpm install` en **backend-receptor** y en **dashboard-test** (respeta `pnpm-lock.yaml`).
2. `pnpm build` del backend (genera `backend-receptor/dist/`).
3. `pnpm build` del frontend con la URL del API apuntando a `http://<tu HOST_IP>:3000` (genera `dashboard-test/dist/`).
4. Construye las imágenes Docker y levanta SQL Server, backend y nginx.

La primera vez puede tardar varios minutos.

**Sin internet** (si ya corriste el paso antes y no cambiaste dependencias):

```bash
./run.sh dev --skip-install
```

Eso omite `pnpm install` pero vuelve a compilar y a levantar Docker.

---

## Paso 3 — Abrir el sistema en el navegador

Cuando el comando termine sin errores:

- **Dashboard:** `http://<tu HOST_IP>:80`  
  En la misma máquina también puedes usar `http://localhost:80`
- **Backend (API):** `http://<tu HOST_IP>:3000`

Sustituye `<tu HOST_IP>` por el valor que pusiste en `.env` (o el que mostró el script si se detectó sola).

---

## Apagar el entorno

```bash
./run.sh down
```

---

## Imágenes Docker sin internet (caché local)

El `docker-compose.yml` de desarrollo está configurado para:

- **No forzar pull** de las bases `node:18-alpine` y `nginx:alpine` al hacer build del backend y de nginx (`pull: false`).
- **No volver a descargar** SQL Server si la imagen ya existe en el servidor (`pull_policy: if_not_present`).

Así, si ya ejecutaste un build o un `docker pull` con internet, las siguientes veces deberían usar lo que hay en caché.

**Comprobar que están locales:**

```bash
docker images | grep -E 'node|nginx|mssql'
```

**Traer las imágenes a otra máquina sin red** (en un PC con internet, guardar y copiar el `.tar`):

```bash
docker pull node:18-alpine
docker pull nginx:alpine
docker pull mcr.microsoft.com/mssql/server:2022-latest
docker save node:18-alpine nginx:alpine mcr.microsoft.com/mssql/server:2022-latest -o track-io-docker-bases.tar
```

En el servidor sin internet:

```bash
docker load -i track-io-docker-bases.tar
```

---

## Si algo falla

- **“pnpm no esta instalado”:** instala pnpm (`npm install -g pnpm`) y vuelve a ejecutar el paso 2.
- **Error de login en SQL / contraseña:** revisa que `MSSQL_SA_PASSWORD` y las demás variables de base de datos en `.env` coincidan y que la contraseña no lleve `@` ni `#`.
- **Login failed for user 'sa':** revisa la nota anterior y la sección de solución de problemas en [README.md](./README.md).

Para más detalle técnico del flujo Docker, ver [DESARROLLO.md](./DESARROLLO.md).

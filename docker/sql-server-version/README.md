# Track.IO - Docker (SQL Server)

Sistema Track.IO con Microsoft SQL Server 2022 en Docker. Un solo script gestiona desarrollo, testing y producción.

## Requisitos

- Docker Desktop (Windows/Mac) o Docker Engine + Docker Compose (Linux)
- 4GB RAM mínimo (8GB recomendado)
- 10GB espacio en disco
- SQL Server requiere al menos 2GB de RAM

## Comandos

| Comando | Descripción |
|---------|-------------|
| `run.bat` / `./run.sh` | Muestra ayuda |
| `run.bat db-init` / `./run.sh db-init` | Crea red Docker y contenedor SQL Server (requerido antes de prod) |
| `run.bat dev` / `./run.sh dev` | Levanta entorno de desarrollo |
| `run.bat test` / `./run.sh test` | Levanta entorno de testing |
| `run.bat prod` / `./run.sh prod` | Levanta producción |
| `run.bat down [dev,test,prod]` / `./run.sh down [env]` | Detiene el entorno indicado |

**Windows:** `run.bat`  
**Linux/Mac:** `./run.sh` (o `bash run.sh`)

## Primer uso

### Desarrollo

```bash
cd docker/sql-server-version

# Crear .env si no existe
copy env.example .env   # Windows
cp env.example .env    # Linux/Mac

# Editar .env con MSSQL_SA_PASSWORD (evitar @ y # en la contraseña)

# Iniciar
run.bat dev            # Windows
./run.sh dev           # Linux/Mac
```

URLs: Dashboard http://localhost:80 | Virtual Device http://localhost/virtual-device/ | Backend http://localhost:3000 | SQL Server localhost:1434

### Producción

```bash
cd docker/sql-server-version

# Crear .env.production
copy env.production.template .env.production   # Windows
cp env.production.template .env.production     # Linux/Mac

# Editar .env.production con MSSQL_SA_PASSWORD_PROD (evitar @ y #)

# 1. Crear base de datos (solo la primera vez)
run.bat db-init        # Windows
./run.sh db-init       # Linux/Mac

# 2. Iniciar producción
run.bat prod           # Windows
./run.sh prod          # Linux/Mac
```

## Estructura de archivos

| Archivo | Propósito |
|---------|-----------|
| `run.bat` / `run.sh` | Script unificado |
| `docker-compose.yml` | Desarrollo (SQL Server + Backend + Nginx) |
| `docker-compose.test.yml` | Testing (Cypress) |
| `docker-compose.prod.yml` | Producción (Backend + Nginx con Dashboard y Virtual Device, SQL Server externo) |
| `env.example` | Plantilla para `.env` (desarrollo) |
| `env.production.template` | Plantilla para `.env.production` |
| `.env.host` / `.env.host.prod` | Generados automáticamente (IP, VITE_API_URL, CORS) |

## Variables de entorno

### Desarrollo (`.env`)

- `MSSQL_SA_PASSWORD`: Contraseña SA (evitar `@` y `#` en URLs)
- `MSSQL_DB`: Nombre de la base de datos
- `MSSQL_PORT`: Puerto host (default 1434)
- `VIRTUAL_DEVICE_PORT`: (obsoleto) Virtual Device ahora en http://localhost/virtual-device/
- `VITE_AUTH_TOKEN`: JWT opcional para endpoints protegidos en virtual-device

### Producción (`.env.production`)

- `MSSQL_SA_PASSWORD_PROD`: Contraseña SA (obligatorio)
- `MSSQL_DB_PROD`: Nombre de la base de datos
- `MSSQL_PORT_PROD`: Puerto host para SQL Server
- `MSSQL_PID`: Edición (Express, Developer, etc.)
- `DATABASE_HOST_PROD`: Host del SQL Server (default: track-io-sqlserver-prod)
- `BACKEND_PORT_PROD`, `NGINX_PORT_PROD`, `NGINX_SSL_PORT_PROD`
- `CORS_ORIGIN_PROD`: Orígenes CORS adicionales (opcional)
- `VITE_AUTH_TOKEN_PROD`: JWT opcional para endpoints protegidos en virtual-device

Ver `env.production.template` para la lista completa.

## Solución de problemas

### "Login failed for user 'sa'"

- La contraseña no debe contener `@` ni `#` (rompen el parsing de URLs y shells)
- Usar contraseñas como `TuPasswordSeguro123!` o `TrackIO123!`
- Si cambias la contraseña, recrea el contenedor SQL Server:
  ```bash
  docker stop track-io-sqlserver-prod
  docker rm track-io-sqlserver-prod
  docker volume rm sqlserver_prod_data
  run.bat db-init   # o ./run.sh db-init
  ```

### "network track_iq_production_sql_server declared as external, but could not be found"

Ejecuta `run.bat db-init` (o `./run.sh db-init`) antes de `prod`.

### SQL Server tarda en iniciar

El primer arranque puede tardar 30-60 segundos. `db-init` espera hasta 60s automáticamente.

### Ver logs

```bash
docker compose -f docker-compose.prod.yml logs -f    # Producción
docker compose -f docker-compose.yml logs -f         # Desarrollo
docker logs track-io-sqlserver-prod                  # SQL Server
```

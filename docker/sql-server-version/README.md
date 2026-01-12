# Track.IO - Docker Setup (SQL Server Version)

Guía de instalación y uso del sistema Track.IO con Microsoft SQL Server en Docker.

---

## 📋 Requisitos Previos

- **Docker Desktop** (Windows/Mac) o **Docker Engine + Docker Compose** (Linux)
- **Git** (para clonar el repositorio)
- **4GB RAM mínimo** (8GB recomendado)
- **10GB espacio en disco** libre
- **Requisito especial**: SQL Server requiere al menos 2GB de RAM

---

## 🪟 Instalación en Windows

### Paso 1: Instalar Docker Desktop

1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop
2. Ejecuta el instalador y sigue las instrucciones
3. Reinicia tu computadora cuando se solicite
4. Abre Docker Desktop y espera a que inicie completamente

### Paso 2: Verificar Instalación

Abre PowerShell o CMD y ejecuta:

```powershell
docker --version
docker compose version
```

Deberías ver las versiones instaladas.

### Paso 3: Configurar Variables de Entorno

Copia el archivo de ejemplo y configura las variables:

```powershell
cd docker/sql-server-version
copy env.example .env
```

Edita el archivo `.env` y configura:
- `MSSQL_SA_PASSWORD`: Contraseña segura para el usuario `sa` de SQL Server
  - **IMPORTANTE**: Debe cumplir con los requisitos de seguridad de SQL Server:
    - Mínimo 8 caracteres
    - Debe contener mayúsculas, minúsculas, números y caracteres especiales
    - Ejemplo: `YourStrong@Password123`

### Paso 4: Iniciar el Sistema

```powershell
start.bat
```

El script automáticamente:

- ✅ Detecta la IP de tu equipo
- ✅ Configura el sistema para acceso en red
- ✅ Construye e inicia todos los servicios
- ✅ Muestra las URLs de acceso

**⏱️ Tiempo estimado:** 5-15 minutos en la primera ejecución (SQL Server tarda más en iniciar que PostgreSQL)

---

## 🐧 Instalación en Linux (Debian/Ubuntu)

### Paso 1: Instalar Docker

```bash
# Actualizar el sistema
sudo apt update
sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Agregar clave GPG de Docker
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Agregar tu usuario al grupo docker (para no usar sudo)
sudo usermod -aG docker $USER

# Cerrar sesión y volver a iniciar sesión para aplicar cambios
```

### Paso 2: Verificar Instalación

```bash
docker --version
docker compose version
```

### Paso 3: Configurar Variables de Entorno

```bash
cd docker/sql-server-version
cp env.example .env
```

Edita el archivo `.env` y configura `MSSQL_SA_PASSWORD` con una contraseña segura.

### Paso 4: Iniciar el Sistema

```bash
chmod +x start.sh
./start.sh
```

---

## 🍎 Instalación en macOS

### Paso 1: Instalar Docker Desktop

1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop
2. Abre el archivo `.dmg` descargado
3. Arrastra Docker a la carpeta Applications
4. Abre Docker Desktop desde Applications
5. Espera a que Docker inicie completamente

### Paso 2: Verificar Instalación

Abre Terminal y ejecuta:

```bash
docker --version
docker compose version
```

### Paso 3: Configurar Variables de Entorno

```bash
cd docker/sql-server-version
cp env.example .env
```

Edita el archivo `.env` y configura `MSSQL_SA_PASSWORD`.

### Paso 4: Iniciar el Sistema

```bash
chmod +x start.sh
./start.sh
```

---

## 🌐 Acceso al Sistema

Después de ejecutar `start.bat` o `start.sh`, verás las URLs de acceso:

### Acceso Local (misma computadora):

- **Dashboard**: http://localhost
- **Backend API**: http://localhost:3000
- **SQL Server**: localhost:1433

### Acceso en Red Local (otros dispositivos):

- **Dashboard**: http://[TU_IP]
- **Backend API**: http://[TU_IP]:3000
- **SQL Server**: [TU_IP]:1433

**Ejemplo:**

```
🌐 URLs de acceso:
   [Acceso en Red Local]
     Dashboard:       http://192.168.1.100
     Backend API:     http://192.168.1.100:3000
     SQL Server:      192.168.1.100:1433
```

---

## 🧪 Ambiente de Testing

Para ejecutar tests E2E con Cypress, existe un ambiente de testing separado que usa SQL Server.

### Iniciar Ambiente de Testing

**Windows:**
```powershell
cd docker/sql-server-version
.\start-test.bat
```

**Linux/Mac:**
```bash
cd docker/sql-server-version
chmod +x start-test.sh
./start-test.sh
```

### Detener Ambiente de Testing

**Windows:**
```powershell
cd docker/sql-server-version
.\stop-test.bat
```

**Linux/Mac:**
```bash
cd docker/sql-server-version
chmod +x stop-test.sh
./stop-test.sh
```

### Servicios de Testing

El ambiente de testing usa:
- **SQL Server**: Puerto `1435` (para no conflictuar con producción en puerto 1434)
- **Backend API**: Puerto `3001` (para no conflictuar con producción en puerto 3000)
- **Red separada**: `track_io_test_network` (aislada de producción)
- **Volumen separado**: `track_io_sqlserver_test_data` (no afecta datos de producción)

### Configuración de Testing

Las variables de entorno para testing se configuran en `docker-compose.test.yml` o mediante variables de entorno:

```bash
# Variables de testing (opcionales, tienen valores por defecto)
MSSQL_SA_PASSWORD_TEST=YourStrong@Password123Test
MSSQL_DB_TEST=track_io_test
MSSQL_ENCRYPT_TEST=false
MSSQL_TRUST_SERVER_CERTIFICATE_TEST=true
```

**Nota:** El ambiente de testing usa `TYPEORM_SYNCHRONIZE=true` para sincronizar automáticamente el schema sin necesidad de ejecutar migraciones manualmente.

---

## 🔧 Comandos Útiles

### Ver logs en tiempo real

```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo nginx
docker compose logs -f nginx

# Solo SQL Server
docker compose logs -f track_io_sql_server
```

### Detener servicios

```bash
docker compose down
```

### Reiniciar servicios

```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

### Ver estado de los servicios

```bash
docker compose ps
```

### Acceder a la consola del backend

```bash
docker compose exec backend sh
```

### Conectar a SQL Server

```bash
# Usando sqlcmd (dentro del contenedor SQL Server)
docker compose exec track_io_sql_server /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Password123 -d track_io

# O desde tu máquina (si tienes sqlcmd instalado)
sqlcmd -S localhost -U sa -P YourStrong@Password123 -d track_io
```

### Ejecutar migraciones manualmente

```bash
docker compose exec backend npm run migration:run
```

---

## 🔄 Actualizar el Sistema

Cuando hay cambios en el código:

```bash
# 1. Actualizar código
git pull

# 2. Reiniciar servicios
# Windows:
start.bat

# Linux/Mac:
./start.sh

# 3. Si hay nuevas migraciones, ejecutarlas
docker compose exec backend npm run migration:run
```

**Nota:** El script detecta automáticamente si la IP cambió y solo reconstruye si es necesario.

---

## 🚨 Solución de Problemas

### Error: "port is already allocated"

El puerto 1433 (SQL Server) o 3000 está en uso. Solución:

```bash
# Detener todos los contenedores
docker compose down

# Ver qué está usando el puerto
# Windows:
netstat -ano | findstr :1433

# Linux/Mac:
sudo lsof -i :1433
```

### Error: "Cannot connect to Docker daemon"

Docker no está corriendo. Solución:

**Windows/Mac:** Abre Docker Desktop

**Linux:**

```bash
sudo systemctl start docker
sudo systemctl enable docker
```

### SQL Server no inicia / Error de contraseña

**Problema:** La contraseña de SQL Server no cumple con los requisitos de seguridad.

**Solución:** Asegúrate de que `MSSQL_SA_PASSWORD` en `.env`:
- Tiene al menos 8 caracteres
- Contiene mayúsculas, minúsculas, números y caracteres especiales
- Ejemplo válido: `YourStrong@Password123`

**Ver logs:**

```bash
docker compose logs track_io_sql_server
```

### Error: "Login failed for user 'sa'"

**Problema:** La contraseña está incorrecta o SQL Server aún no está listo.

**Solución:**
1. Espera 30-60 segundos después de iniciar SQL Server (tarda más en inicializarse)
2. Verifica que la contraseña en `.env` sea correcta
3. Verifica los logs: `docker compose logs track_io_sql_server`

### Los servicios no inician

```bash
# Ver logs de errores
docker compose logs

# Verificar estado
docker compose ps

# Reiniciar desde cero
docker compose down -v
./start.sh  # o start.bat
```

### El frontend no carga

```bash
# Verificar que nginx esté corriendo
docker compose ps nginx

# Ver logs de nginx
docker compose logs nginx

# Verificar que el backend responda
curl http://localhost:3000
```

### Las migraciones fallan

```bash
# Ver logs del backend
docker compose logs backend

# Verificar que SQL Server esté listo
docker compose ps track_io_sql_server

# Verificar conexión manualmente
docker compose exec backend sh
# Dentro del contenedor:
npm run migration:show
```

---

## 📁 Estructura de Archivos

```
docker/sql-server-version/
├── docker-compose.yml       # Configuración principal de Docker (producción)
├── docker-compose.test.yml  # Configuración de testing (E2E con Cypress)
├── start.bat                # Script de inicio para Windows (producción)
├── start.sh                 # Script de inicio para Linux/Mac (producción)
├── start-test.bat           # Script de inicio de testing para Windows
├── start-test.sh            # Script de inicio de testing para Linux/Mac
├── stop-test.bat            # Script para detener testing (Windows)
├── stop-test.sh             # Script para detener testing (Linux/Mac)
├── env.example              # Ejemplo de variables de entorno
└── README.md                # Este archivo
```

---

## ✨ Características

- **🚀 Un solo comando**: Solo ejecuta `start.bat` o `start.sh`
- **🌐 Configuración automática de red**: Detecta IP y configura todo automáticamente
- **⚡ Reconstrucción inteligente**: Solo reconstruye cuando la IP cambia
- **🔄 Reinicio automático**: Los contenedores se inician automáticamente al reiniciar el equipo
- **📡 Acceso en red**: Otros dispositivos pueden acceder inmediatamente
- **💾 Persistencia de datos**: Los datos sobreviven a reinicios de contenedores
- **🔒 Sin problemas de CORS**: Proxy reverso elimina problemas de CORS
- **🗄️ Microsoft SQL Server 2022**: Base de datos empresarial con alto rendimiento

---

## ⚙️ Variables de Entorno

Puedes configurar el sistema mediante variables de entorno. Crea un archivo `.env` en la carpeta `docker/sql-server-version/` o exporta las variables antes de ejecutar `start.bat` o `start.sh`:

### Variables de SQL Server

```bash
# Contraseña del usuario 'sa' (OBLIGATORIO - debe ser segura)
MSSQL_SA_PASSWORD=YourStrong@Password123

# Nombre de la base de datos
MSSQL_DB=track_io

# Puerto de SQL Server
MSSQL_PORT=1433
```

### Variables de Conexión a la Base de Datos

```bash
# Tipo de base de datos (debe ser 'mssql' o 'sqlserver')
DATABASE_TYPE=mssql

# Configuración de conexión
DATABASE_HOST=track_io_sql_server
DATABASE_PORT=1433
DATABASE_USERNAME=sa
DATABASE_PASSWORD=YourStrong@Password123
DATABASE_NAME=track_io

# Cadena de conexión completa
DATABASE_URL=mssql://sa:YourStrong@Password123@track_io_sql_server:1433/track_io
```

### Variables de Módulos del Sistema

Controla qué módulos están habilitados en el sistema:

```bash
# Habilitar/deshabilitar módulo de Mediciones (default: true)
MODULE_MEASUREMENTS_ENABLED=true

# Habilitar/deshabilitar módulo de Señales (default: true)
MODULE_SIGNALS_ENABLED=true
```

### Otras Variables Disponibles

```bash
# Backend
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*

# Frontend
VITE_API_URL=http://localhost:3000
```

---

## 🔄 Diferencias con Versión PostgreSQL

Esta versión usa **Microsoft SQL Server 2022** en lugar de PostgreSQL. Las principales diferencias son:

### Tipos de Datos

- **ENUMs**: En PostgreSQL se usan tipos ENUM nativos. En SQL Server se usan `VARCHAR` con `CHECK` constraints.
- **JSONB**: En PostgreSQL se usa `jsonb`. En SQL Server se usa `NVARCHAR(MAX)`.
- **Timestamps**: En PostgreSQL se usa `timestamp with time zone`. En SQL Server se usa `datetimeoffset`.
- **Auto-increment**: En PostgreSQL se usa `SERIAL`. En SQL Server se usa `IDENTITY(1,1)`.

### Funciones SQL

- **now() / NOW()**: En PostgreSQL. En SQL Server se usa `SYSDATETIMEOFFSET()` o `GETDATE()`.
- **ON CONFLICT**: En PostgreSQL. En SQL Server se usa `MERGE` o `IF NOT EXISTS`.

### Configuración

- **Puerto**: SQL Server usa puerto `1433` (PostgreSQL usa `5432`).
- **Usuario**: SQL Server usa `sa` como usuario administrador (PostgreSQL usa `postgres`).
- **Contraseña**: SQL Server requiere contraseñas más seguras con requisitos específicos.

### Rendimiento

- SQL Server generalmente requiere más recursos (RAM, CPU) que PostgreSQL.
- El inicio de SQL Server puede tardar más tiempo (30-60 segundos vs 10-20 segundos de PostgreSQL).

---

## 📝 Notas Importantes

- **Primera ejecución**: Puede tardar 10-15 minutos mientras descarga imágenes y compila
- **SQL Server**: Tarda más en iniciar que PostgreSQL (30-60 segundos)
- **Contraseña**: Debe cumplir con requisitos de seguridad de SQL Server
- **Reinicio del equipo**: Los contenedores se iniciarán automáticamente gracias a `restart: always`
- **Cambio de red**: Si cambias de WiFi a Ethernet, ejecuta `start.bat` o `start.sh` de nuevo
- **Migraciones**: Se ejecutan automáticamente al iniciar, no necesitas ejecutarlas manualmente
- **Módulos del sistema**: Puedes habilitar/deshabilitar módulos mediante variables de entorno sin modificar código

---

## 🆘 ¿Necesitas Ayuda?

1. Verifica que Docker esté corriendo: `docker ps`
2. Revisa los logs: `docker compose logs -f`
3. Verifica el estado: `docker compose ps`
4. Reinicia desde cero: `docker compose down -v && ./start.sh`

---

## 📚 Recursos Adicionales

- [Documentación de Microsoft SQL Server](https://docs.microsoft.com/en-us/sql/)
- [Documentación de TypeORM con SQL Server](https://typeorm.io/#/connection-options/what-is-connectionsql-server)
- [Docker Hub - SQL Server](https://hub.docker.com/_/microsoft-mssql-server)

---

**Versión SQL Server** | Última actualización: $(date)

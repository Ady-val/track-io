# 🚀 Guía: Levantar Sistema Completo en Producción

Esta guía te llevará paso a paso para levantar todo el sistema Track.IO en modo producción usando Docker.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- ✅ **Docker Desktop** (o Docker Engine + Docker Compose)
- ✅ **Git** (para clonar el repositorio si es necesario)
- ✅ **Acceso a internet** (para descargar imágenes de Docker en la primera ejecución)

## 🔍 Verificación Inicial

### 1. Verificar que Docker está funcionando

**Windows (PowerShell):**
```powershell
docker --version
docker-compose --version
docker ps
```

**Linux/Mac:**
```bash
docker --version
docker-compose --version
docker ps
```

Si ves errores, asegúrate de que Docker Desktop esté ejecutándose.

### 2. Verificar que los puertos están libres

El sistema usa los siguientes puertos:
- **80** - Nginx (frontends)
- **3000** - Backend API
- **5432** - PostgreSQL

**Windows:**
```powershell
netstat -ano | findstr :80
netstat -ano | findstr :3000
netstat -ano | findstr :5432
```

**Linux/Mac:**
```bash
lsof -i :80
lsof -i :3000
lsof -i :5432
```

Si algún puerto está en uso, detén el servicio que lo está ocupando o cambia los puertos en `docker-compose.yml`.

## 📁 Estructura de Archivos Necesarios

Asegúrate de estar en el directorio correcto:

```
track-io/
├── docker/
│   ├── docker-compose.yml      ✅ Debe existir
│   ├── start.sh                 ✅ Debe existir (Linux/Mac)
│   ├── start.bat                ✅ Debe existir (Windows)
│   ├── env.example              ✅ Debe existir
│   └── Dockerfile.backend       ✅ Debe existir
├── backend-receptor/
│   ├── src/
│   │   └── migrations/
│   │       └── 1000000000000-InitialSchema.ts  ✅ Migración inicial
│   └── scripts/
│       └── start-with-migrations.sh  ✅ Script de inicio
└── ...
```

## 🎯 Pasos para Levantar el Sistema

### **Paso 1: Navegar al directorio Docker**

```bash
cd docker
```

### **Paso 2: (Opcional) Configurar Variables de Entorno**

Si necesitas personalizar la configuración (contraseñas, nombres de base de datos, etc.):

**Windows:**
```powershell
copy env.example .env
notepad .env
```

**Linux/Mac:**
```bash
cp env.example .env
nano .env
```

**Variables importantes:**
```env
POSTGRES_DB=track_io              # Nombre de la base de datos
POSTGRES_USER=postgres            # Usuario de PostgreSQL
POSTGRES_PASSWORD=postgres        # Contraseña (¡cámbiala en producción!)
NODE_ENV=production               # Entorno de Node.js
```

**Nota:** Si no creas el archivo `.env`, se usarán los valores por defecto del `docker-compose.yml`.

### **Paso 3: Limpiar Contenedores Anteriores (Si Existen)**

Si ya tienes contenedores corriendo y quieres empezar limpio:

```bash
docker-compose down
```

O si quieres eliminar también los volúmenes (⚠️ **CUIDADO: Esto borra todos los datos**):

```bash
docker-compose down -v
```

### **Paso 4: Ejecutar el Script de Inicio**

El script detectará automáticamente tu IP y configurará todo el sistema.

**Windows:**
```batch
start.bat
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
```

### **Paso 5: Observar el Proceso**

El script realizará las siguientes acciones automáticamente:

1. 🔍 **Detecta tu IP** del equipo
   ```
   🔍 Detectando IP del equipo...
      IP detectada: 192.168.1.100
   ```

2. 📝 **Configura variables de entorno**
   ```
   📝 Configurando variables de entorno...
   ```

3. 🐳 **Inicia Docker Compose**
   ```
   🐳 Iniciando Docker Compose...
   ```

4. 🏗️ **Construye las imágenes** (primera vez o si cambió la IP)
   ```
   Reconstruyendo servicios con nueva IP...
   ```

5. 🚀 **Levanta los servicios:**
   - PostgreSQL (`track_io_postgres`)
   - Backend NestJS (`track_io_backend`) - **Ejecuta migraciones automáticamente**
   - Nginx (`track_io_nginx`)

### **Paso 6: Verificar que Todo Está Funcionando**

#### 6.1. Verificar Estado de los Contenedores

```bash
docker-compose ps
```

Deberías ver algo como:

```
NAME                  STATUS              PORTS
track_io_backend      Up 30 seconds       0.0.0.0:3000->3000/tcp
track_io_nginx        Up 25 seconds       0.0.0.0:80->80/tcp
track_io_postgres     Up 35 seconds       0.0.0.0:5432->5432/tcp
```

#### 6.2. Verificar Logs del Backend

```bash
docker-compose logs backend
```

Deberías ver:

```
🔄 Running database migrations...
query: SELECT * FROM "migrations" ORDER BY "id" DESC
query: CREATE TYPE "public"."measurements_type_enum" AS ENUM...
...
✅ Migrations completed successfully
🚀 Starting application...
[Nest] 1  - 01/15/2024, 10:30:00 AM     LOG [NestFactory] Starting Nest application...
[Nest] 1  - 01/15/2024, 10:30:01 AM     LOG [InstanceLoader] AppModule dependencies initialized
...
[Nest] 1  - 01/15/2024, 10:30:02 AM     LOG [NestApplication] Nest application successfully started
```

#### 6.3. Verificar Logs de PostgreSQL

```bash
docker-compose logs postgres
```

Deberías ver:

```
database system is ready to accept connections
```

#### 6.4. Verificar Logs de Nginx

```bash
docker-compose logs nginx
```

### **Paso 7: Probar los Endpoints**

Una vez que todo esté funcionando, el script te mostrará las URLs de acceso:

```
✅ Servicios iniciados correctamente!

🌐 URLs de acceso:
   [Acceso Local]
     Dashboard:       http://localhost
     Virtual Device:  http://localhost/virtual-device
     Backend API:     http://localhost:3000

   [Acceso en Red Local]
     Dashboard:       http://192.168.1.100
     Virtual Device:  http://192.168.1.100/virtual-device
     Backend API:     http://192.168.1.100:3000
```

#### 7.1. Probar Backend API

**En el navegador o con curl:**

```bash
curl http://localhost:3000
```

O abre en el navegador: `http://localhost:3000`

Deberías ver una respuesta del backend (puede ser un error 404 si no hay ruta raíz, pero significa que el servidor está funcionando).

#### 7.2. Probar Dashboard

Abre en el navegador: `http://localhost`

Deberías ver la interfaz del Dashboard.

#### 7.3. Probar Virtual Device

Abre en el navegador: `http://localhost/virtual-device`

Deberías ver la interfaz del Virtual Device.

#### 7.4. Verificar Migraciones

Para confirmar que las migraciones se ejecutaron correctamente:

```bash
docker-compose exec backend npm run migration:show
```

Deberías ver la migración `InitialSchema1000000000000` como ejecutada.

## 🔍 Verificación de la Base de Datos

### Conectar a PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d track_io
```

### Verificar Tablas Creadas

```sql
\dt
```

Deberías ver todas las tablas del sistema.

### Verificar Datos Iniciales

```sql
-- Verificar permisos
SELECT COUNT(*) FROM permissions;
-- Debería mostrar 56

-- Verificar message_groups
SELECT * FROM message_groups;
-- Debería mostrar 5 grupos

-- Verificar torreta_colors
SELECT * FROM torreta_colors;
-- Debería mostrar 8 colores
```

Salir de PostgreSQL:
```sql
\q
```

## 🛠️ Comandos Útiles Durante las Pruebas

### Ver Logs en Tiempo Real

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo nginx
docker-compose logs -f nginx

# Solo postgres
docker-compose logs -f postgres
```

### Reiniciar un Servicio Específico

```bash
docker-compose restart backend
docker-compose restart nginx
docker-compose restart postgres
```

### Detener el Sistema

```bash
docker-compose down
```

### Detener y Eliminar Todo (Incluyendo Datos)

```bash
docker-compose down -v
```

⚠️ **ADVERTENCIA:** Esto elimina todos los datos de la base de datos.

### Reconstruir Todo desde Cero

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 🚨 Solución de Problemas Comunes

### Problema 1: "Port already in use"

**Síntoma:**
```
Error: bind: address already in use
```

**Solución:**
1. Identifica qué está usando el puerto:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```
2. Detén el proceso o cambia el puerto en `docker-compose.yml`

### Problema 2: "Migration failed"

**Síntoma:**
```
❌ Migration failed. Exiting.
```

**Solución:**
1. Verifica los logs del backend:
   ```bash
   docker-compose logs backend
   ```
2. Verifica que la base de datos esté accesible:
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```
3. Si es necesario, ejecuta las migraciones manualmente:
   ```bash
   docker-compose exec backend npm run migration:run
   ```

### Problema 3: "Cannot connect to database"

**Síntoma:**
```
Error: connect ECONNREFUSED postgres:5432
```

**Solución:**
1. Verifica que PostgreSQL esté corriendo:
   ```bash
   docker-compose ps postgres
   ```
2. Verifica los logs:
   ```bash
   docker-compose logs postgres
   ```
3. Espera a que PostgreSQL esté completamente listo (puede tardar unos segundos)

### Problema 4: Frontend no carga

**Síntoma:**
- El navegador muestra error o página en blanco

**Solución:**
1. Verifica que Nginx esté corriendo:
   ```bash
   docker-compose ps nginx
   ```
2. Verifica los logs:
   ```bash
   docker-compose logs nginx
   ```
3. Verifica que el backend esté respondiendo:
   ```bash
   curl http://localhost:3000
   ```

### Problema 5: IP no se detecta correctamente

**Síntoma:**
- El script no detecta la IP o detecta una IP incorrecta

**Solución:**
1. Edita manualmente `.env.host`:
   ```env
   HOST_IP=192.168.1.100
   VITE_API_URL=http://192.168.1.100:3000
   ```
2. Reconstruye:
   ```bash
   docker-compose down
   docker-compose --env-file .env.host up -d --build
   ```

## ✅ Checklist de Verificación Final

Antes de considerar que el sistema está completamente funcional, verifica:

- [ ] Los 3 contenedores están corriendo (`docker-compose ps`)
- [ ] El backend muestra "Nest application successfully started" en los logs
- [ ] Las migraciones se ejecutaron correctamente (`migration:show`)
- [ ] El backend responde en `http://localhost:3000`
- [ ] El Dashboard carga en `http://localhost`
- [ ] El Virtual Device carga en `http://localhost/virtual-device`
- [ ] La base de datos tiene las tablas creadas
- [ ] Los datos iniciales están presentes (permisos, message_groups, torreta_colors)
- [ ] Puedes acceder desde otros dispositivos en la red usando la IP mostrada

## 🎉 ¡Listo!

Si todos los puntos del checklist están marcados, el sistema está completamente funcional en producción.

## 📝 Notas Importantes

1. **Primera Ejecución:** La primera vez que ejecutas `start.sh` o `start.bat`, puede tardar varios minutos mientras descarga las imágenes de Docker y construye los contenedores.

2. **Migraciones Automáticas:** El backend ejecuta las migraciones automáticamente al iniciar. No necesitas ejecutarlas manualmente.

3. **Persistencia de Datos:** Los datos de PostgreSQL se guardan en un volumen de Docker llamado `postgres_data`. Estos datos persisten aunque detengas los contenedores.

4. **Cambios de Código:** Si haces cambios en el código, necesitas reconstruir los contenedores:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

5. **Producción Real:** Para un entorno de producción real, asegúrate de:
   - Cambiar las contraseñas por defecto
   - Configurar SSL/TLS
   - Configurar backups de la base de datos
   - Configurar monitoreo y logging





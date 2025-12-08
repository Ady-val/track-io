# 🔒 Separación entre Desarrollo y Producción

Este documento explica cómo asegurar que los entornos de desarrollo y producción estén completamente separados.

## 📊 Configuración Actual

### Producción (`docker-compose.yml`)
- **Contenedor:** `track_io_postgres`
- **Base de datos:** `track_io`
- **Volumen:** `postgres_data`
- **Puerto:** `5432`

### Desarrollo (`docker-compose.dev.yml`)
- **Contenedor:** `track_iq_dev_postgres`
- **Base de datos:** `track_iq_dev`
- **Volumen:** `postgres_dev_data`
- **Puerto:** `5432` (pero contenedor diferente)

## ✅ Verificación de Separación

### 1. Verificar Contenedores

```bash
# Ver todos los contenedores PostgreSQL
docker ps -a | grep postgres
```

Deberías ver:
- `track_io_postgres` (producción)
- `track_iq_dev_postgres` (desarrollo)

### 2. Verificar Volúmenes

```bash
# Ver todos los volúmenes
docker volume ls | grep postgres
```

Deberías ver:
- `docker_postgres_data` (producción)
- `docker_postgres_dev_data` (desarrollo)

### 3. Verificar Bases de Datos

**Producción:**
```bash
docker-compose exec postgres psql -U postgres -c "\l" | grep track_io
# Debería mostrar: track_io
```

**Desarrollo:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -c "\l" | grep track_iq
# Debería mostrar: track_iq_dev
```

## 🚨 Problema Común: Base de Datos Contaminada

Si estás viendo el error:
```
error: relation "area_torreta_configs" already exists
```

Esto significa que la base de datos de producción tiene tablas que no debería tener. Esto puede pasar si:

1. **Ejecutaste desarrollo en la base de datos de producción**
2. **El volumen de producción tiene datos de desarrollo**
3. **Estás usando la misma base de datos para ambos entornos**

## 🔧 Solución: Limpiar Base de Datos de Producción

### Opción 1: Eliminar y Recrear el Volumen (RECOMENDADO)

```bash
# Detener contenedores
cd docker
docker-compose down

# Eliminar volumen de producción (⚠️ BORRA TODOS LOS DATOS)
docker volume rm docker_postgres_data

# Iniciar producción limpia
./start.sh  # o start.bat en Windows
```

### Opción 2: Eliminar Solo la Base de Datos

```bash
# Conectar a PostgreSQL de producción
docker-compose exec postgres psql -U postgres

# Eliminar base de datos
DROP DATABASE IF EXISTS track_io;

# Crear base de datos limpia
CREATE DATABASE track_io;

# Salir
\q

# Las migraciones se ejecutarán automáticamente al reiniciar el backend
docker-compose restart backend
```

### Opción 3: Verificar y Limpiar Tablas Manualmente

```bash
# Conectar a PostgreSQL de producción
docker-compose exec postgres psql -U postgres -d track_io

# Ver todas las tablas
\dt

# Si ves tablas que no deberían estar, elimínalas manualmente
# (Solo si sabes lo que estás haciendo)
```

## 🛡️ Prevención: Mejores Prácticas

### 1. Usar Scripts Correctos

**Producción:**
```bash
cd docker
./start.sh  # o start.bat
```

**Desarrollo:**
```bash
cd backend-receptor
pnpm run db:start
```

### 2. Verificar Variables de Entorno

**Producción (`docker/.env` o `docker/env.example`):**
```env
POSTGRES_DB=track_io
```

**Desarrollo (`backend-receptor/.env`):**
```env
DATABASE_NAME=track_iq_dev
```

### 3. No Mezclar Comandos

❌ **NO HACER:**
```bash
# Ejecutar desarrollo en contenedor de producción
docker-compose exec postgres psql -U postgres -d track_io
```

✅ **HACER:**
```bash
# Desarrollo usa su propio contenedor
pnpm run db:start
```

## 🔍 Diagnóstico Rápido

Si tienes problemas, ejecuta este script de diagnóstico:

```bash
echo "=== CONTENEDORES ==="
docker ps -a | grep postgres

echo "=== VOLÚMENES ==="
docker volume ls | grep postgres

echo "=== BASES DE DATOS EN PRODUCCIÓN ==="
docker-compose exec postgres psql -U postgres -c "\l" 2>/dev/null || echo "Contenedor de producción no está corriendo"

echo "=== BASES DE DATOS EN DESARROLLO ==="
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -c "\l" 2>/dev/null || echo "Contenedor de desarrollo no está corriendo"
```

## 📝 Notas Importantes

1. **Migración Idempotente:** La migración inicial ahora es idempotente (usa `IF NOT EXISTS`), pero aún así es mejor mantener los entornos separados.

2. **Volúmenes Persistentes:** Los datos persisten en volúmenes Docker. Si necesitas empezar limpio, elimina el volumen.

3. **Puerto 5432:** Ambos contenedores usan el puerto 5432, pero son contenedores diferentes, así que no hay conflicto.

4. **Nombres de Contenedores:** Los nombres de contenedores son únicos (`track_io_postgres` vs `track_iq_dev_postgres`), así que no hay conflicto.





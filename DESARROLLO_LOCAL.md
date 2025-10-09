# Guía Completa de Desarrollo Local - Track.IO

Esta guía te ayudará a configurar y ejecutar tanto el backend como el frontend de Track.IO en tu entorno local.

## Requisitos Previos

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- PostgreSQL instalado o Docker para la base de datos
- Git

## Configuración Completa

### 1. Base de Datos

#### Opción A: Usar Docker (Recomendado)

```bash
cd database
docker-compose up -d
```

Esto levantará PostgreSQL en el puerto 5432 con las credenciales por defecto.

#### Opción B: PostgreSQL Local

Asegúrate de tener PostgreSQL corriendo y crea la base de datos:

```sql
CREATE DATABASE track_io;
```

### 2. Backend

```bash
cd backend-receptor

# Instalar dependencias
pnpm install

# El archivo .env ya está creado con configuración por defecto
# Verifica que los valores sean correctos para tu entorno

# Ejecutar migraciones
pnpm run migration:run

# Iniciar servidor en modo desarrollo
pnpm run start:dev
```

El backend estará disponible en `http://localhost:3000`

### 3. Frontend

```bash
cd dashboard-test

# Instalar dependencias
pnpm install

# Crear archivo .env (si no existe)
echo "VITE_API_BASE_URL=http://localhost:3000" > .env

# Iniciar servidor de desarrollo
pnpm dev
```

El frontend estará disponible en `http://localhost:5173`

## Verificación de la Configuración

### Backend

1. Abre tu navegador en `http://localhost:3000`
2. Deberías ver un mensaje indicando que el servidor está corriendo

### Frontend

1. Abre tu navegador en `http://localhost:5173`
2. Navega a la página de "Señales en Tiempo Real"
3. Selecciona un registro de la lista
4. Verifica que se muestre la información del measurement sin errores de CORS

### WebSocket

El WebSocket del backend estará disponible en `ws://localhost:3000` y emitirá eventos:

- `new_raw_signal`
- `new_raw_measurement`

## Configuración de Variables de Entorno

### Backend (.env)

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=track_io
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/track_io

# Application
PORT=3000
NODE_ENV=development

# CORS - Frontend URL
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```bash
# API Backend URL
VITE_API_BASE_URL=http://localhost:3000
```

## Solución de Problemas Comunes

### Error de CORS

**Síntoma**:

```
Access to XMLHttpRequest at 'http://localhost:3000/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solución**:

1. Verifica que `CORS_ORIGIN=http://localhost:5173` esté en `backend-receptor/.env`
2. Reinicia el servidor del backend
3. Refresca el navegador (Ctrl + F5)

### Backend no se conecta a la base de datos

**Solución**:

1. Verifica que PostgreSQL esté corriendo: `docker ps` (si usas Docker)
2. Confirma que la base de datos `track_io` exista
3. Verifica las credenciales en `backend-receptor/.env`
4. Ejecuta las migraciones: `pnpm run migration:run`

### Frontend no puede conectarse al backend

**Solución**:

1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. Confirma que `VITE_API_BASE_URL=http://localhost:3000` esté en `dashboard-test/.env`
3. Reinicia el servidor del frontend

### Puerto 3000 o 5173 ya está en uso

**Solución Backend**:

1. Cambia `PORT=3001` en `backend-receptor/.env`
2. Actualiza `VITE_API_BASE_URL=http://localhost:3001` en `dashboard-test/.env`
3. Reinicia ambos servidores

**Solución Frontend**:

1. Vite elegirá automáticamente el siguiente puerto disponible (5174, 5175, etc.)
2. Actualiza `CORS_ORIGIN` en `backend-receptor/.env` con el nuevo puerto
3. Reinicia el backend

## Flujo de Trabajo de Desarrollo

1. **Inicia la base de datos** (Docker o PostgreSQL local)
2. **Inicia el backend** (`cd backend-receptor && pnpm run start:dev`)
3. **Inicia el frontend** (`cd dashboard-test && pnpm dev`)
4. **Abre el navegador** en `http://localhost:5173`

## Probar la Nueva Funcionalidad de Measurements

1. Crea algunos measurements usando Postman o la API:

   ```bash
   POST http://localhost:3000/measurements
   {
     "externalId": "TEMP-SENSOR-001",
     "name": "Sensor de Temperatura Principal",
     "type": "temperature"
   }
   ```

2. En el frontend, navega a la página de señales en tiempo real

3. Cuando lleguen señales con el mismo `externalId`, selecciónalas y verás la información completa del measurement

## Scripts Útiles

### Backend

```bash
pnpm run start:dev      # Modo desarrollo con hot reload
pnpm run build          # Compilar para producción
pnpm run lint           # Verificar código
pnpm run migration:run  # Ejecutar migraciones
```

### Frontend

```bash
pnpm dev                # Modo desarrollo
pnpm build              # Compilar para producción
pnpm preview            # Preview de build de producción
pnpm lint               # Verificar código
```

## Colección de Postman

Importa los siguientes archivos en Postman para probar la API fácilmente:

- `backend-receptor/Track.IO-API.postman_collection.json`
- `backend-receptor/Track.IO-Development.postman_environment.json`

## Más Información

- **Backend**: Ver `backend-receptor/DESARROLLO_LOCAL.md`
- **Frontend**: Ver `dashboard-test/CONFIGURACION.md`

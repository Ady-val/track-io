# Guía de Desarrollo Local - Track.IO Backend

## Configuración Inicial

### 1. Variables de Entorno

Ya existe un archivo `.env` en la raíz del proyecto con la configuración por defecto:

```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=track_io
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/track_io

# Application Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

Si necesitas modificar alguna configuración, edita el archivo `.env` según tus necesidades.

### 2. Base de Datos

Asegúrate de tener PostgreSQL instalado y corriendo. Puedes usar Docker con el archivo `docker-compose.yml` en la carpeta `database`:

```bash
cd ../database
docker-compose up -d
```

### 3. Instalación de Dependencias

```bash
pnpm install
```

### 4. Ejecutar Migraciones

```bash
pnpm run migration:run
```

### 5. Iniciar el Servidor

```bash
pnpm run start:dev
```

El backend estará disponible en `http://localhost:3000`

## Configuración de CORS

El backend está configurado para aceptar peticiones del frontend en desarrollo:

- **Origen permitido**: `http://localhost:5173` (configurable con `CORS_ORIGIN`)
- **Métodos permitidos**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers permitidos**: Content-Type, Authorization, Accept
- **Credenciales**: Habilitadas

### Cambiar el origen permitido

Si tu frontend corre en un puerto diferente, modifica la variable `CORS_ORIGIN` en el archivo `.env`:

```bash
CORS_ORIGIN=http://localhost:4000
```

Para permitir múltiples orígenes en producción, puedes modificar la configuración en `src/main.ts`.

## Endpoints Principales

### Measurements

- `GET /measurements` - Listar measurements
  - Query params: `externalId`, `type`, `limit`, `offset`
- `GET /measurements/:id` - Obtener measurement por ID
- `POST /measurements` - Crear nuevo measurement
- `PUT /measurements/:id` - Actualizar measurement
- `DELETE /measurements/:id` - Eliminar measurement

### Device Signals

- `GET /device-signals` - Listar señales de dispositivos
- `POST /device-signals` - Crear nueva señal

### Raw Measurements

- `GET /raw-measurements` - Listar mediciones raw
- `POST /raw-measurements` - Crear nueva medición raw

## WebSocket

El servidor WebSocket está habilitado y emite eventos en tiempo real:

- `new_raw_signal` - Nueva señal recibida
- `new_raw_measurement` - Nueva medición recibida

Conexión WebSocket: `ws://localhost:3000`

## Colección de Postman

Existe una colección de Postman con todos los endpoints:

- `Track.IO-API.postman_collection.json`
- `Track.IO-Development.postman_environment.json`

Importa estos archivos en Postman para probar la API fácilmente.

## Solución de Problemas

### Error de CORS

Si sigues viendo errores de CORS:

1. Verifica que el backend esté corriendo en el puerto 3000
2. Asegúrate de que `CORS_ORIGIN` en `.env` coincida con la URL de tu frontend
3. Reinicia el servidor del backend después de cambiar las variables de entorno

### Error de Conexión a Base de Datos

1. Verifica que PostgreSQL esté corriendo: `docker ps` o revisa el servicio local
2. Confirma las credenciales en el archivo `.env`
3. Verifica que la base de datos `track_io` exista

### Puerto en Uso

Si el puerto 3000 está ocupado:

1. Cambia el valor de `PORT` en el archivo `.env`
2. Actualiza `VITE_API_BASE_URL` en el frontend para que apunte al nuevo puerto
3. Reinicia ambos servidores

## Scripts Disponibles

```bash
# Desarrollo
pnpm run start:dev

# Producción
pnpm run build
pnpm run start:prod

# Tests
pnpm run test
pnpm run test:e2e

# Linting
pnpm run lint

# Migraciones
pnpm run migration:run
pnpm run migration:revert
pnpm run migration:generate
```

# Track.IO API - Guía de Postman

Esta guía te ayudará a importar y utilizar la colección de Postman para la API de Track.IO Backend Receptor.

## 📦 Archivos Disponibles

El proyecto incluye los siguientes archivos de Postman:

1. **`Track.IO-API.postman_collection.json`** - Colección completa de la API con todos los endpoints
2. **`Track.IO-Development.postman_environment.json`** - Entorno para desarrollo local
3. **`Track.IO-Production.postman_environment.json`** - Entorno para producción (template)

## 🚀 Importación Rápida

### Opción 1: Importar desde Archivos

1. Abre Postman
2. Click en **Import** (botón superior izquierdo)
3. Arrastra y suelta los archivos o selecciónalos:
   - `Track.IO-API.postman_collection.json`
   - `Track.IO-Development.postman_environment.json`
   - `Track.IO-Production.postman_environment.json` (opcional)
4. Click en **Import**

### Opción 2: Importar desde Directorio

1. Abre Postman
2. Click en **Import**
3. Selecciona **Folder**
4. Navega a la carpeta `backend-receptor` de tu proyecto
5. Selecciona los archivos JSON
6. Click en **Import**

## ⚙️ Configuración

### Seleccionar Entorno

1. En la esquina superior derecha de Postman, encontrarás el selector de entornos
2. Selecciona **Track.IO - Development** para desarrollo local
3. O selecciona **Track.IO - Production** para producción (actualiza la URL primero)

### Variables de Entorno

#### Development Environment
- `baseUrl`: `http://localhost:3000`
- `websocketUrl`: `ws://localhost:3000`
- `environment`: `development`

#### Production Environment
- `baseUrl`: `https://api.track-io.com` (actualízalo con tu URL de producción)
- `websocketUrl`: `wss://api.track-io.com` (actualízalo con tu URL de producción)
- `environment`: `production`

### Modificar Variables de Entorno

1. Click en el ícono de ojo 👁️ al lado del selector de entornos
2. Click en **Edit** junto al entorno que deseas modificar
3. Actualiza los valores según sea necesario
4. Click en **Save**

## 📚 Estructura de la Colección

La colección está organizada en las siguientes carpetas:

### 1. **Areas**
Gestión de áreas geográficas u organizacionales.

- `POST /areas` - Crear nueva área
- `GET /areas` - Obtener todas las áreas (con paginación y filtros)
- `GET /areas/count` - Contar áreas
- `GET /areas/:id` - Obtener área por ID
- `PATCH /areas/:id` - Actualizar área
- `DELETE /areas/:id` - Eliminar área (soft delete)
- `PATCH /areas/:id/restore` - Restaurar área eliminada

### 2. **Departments**
Gestión de departamentos.

- `POST /departments` - Crear nuevo departamento
- `GET /departments` - Obtener todos los departamentos (con paginación y filtros)
- `GET /departments/count` - Contar departamentos
- `GET /departments/:id` - Obtener departamento por ID
- `PATCH /departments/:id` - Actualizar departamento
- `DELETE /departments/:id` - Eliminar departamento (soft delete)
- `PATCH /departments/:id/restore` - Restaurar departamento eliminado

### 3. **Devices**
Gestión de dispositivos IoT.

- `POST /devices` - Crear nuevo dispositivo
- `GET /devices` - Obtener todos los dispositivos (con paginación y filtros)
- `GET /devices/count` - Contar dispositivos
- `GET /devices/area/:areaId/count` - Contar dispositivos por área
- `GET /devices/area/:areaId` - Obtener dispositivos por área
- `GET /devices/external/:externalId` - Obtener dispositivo por ID externo
- `GET /devices/:id` - Obtener dispositivo por ID
- `PATCH /devices/:id` - Actualizar dispositivo
- `DELETE /devices/:id` - Eliminar dispositivo (soft delete)
- `PATCH /devices/:id/restore` - Restaurar dispositivo eliminado

### 4. **Device Signals**
Gestión de señales de dispositivos (configuraciones de mapeo de señales).

- `POST /device-signals` - Crear nueva señal de dispositivo
- `GET /device-signals` - Obtener todas las señales (con paginación y filtros)
- `GET /device-signals/count` - Contar señales
- `GET /device-signals/device/:deviceId/count` - Contar señales por dispositivo
- `GET /device-signals/department/:departmentId/count` - Contar señales por departamento
- `GET /device-signals/device/:deviceId` - Obtener señales por dispositivo
- `GET /device-signals/department/:departmentId` - Obtener señales por departamento
- `GET /device-signals/external/:externalValueId` - Obtener señal por ID de valor externo
- `GET /device-signals/:id` - Obtener señal por ID
- `PATCH /device-signals/:id` - Actualizar señal
- `DELETE /device-signals/:id` - Eliminar señal (soft delete)
- `PATCH /device-signals/:id/restore` - Restaurar señal eliminada

### 5. **Raw Signals**
Procesamiento y consulta de datos de señales sin procesar (datos de series temporales).

- `POST /signals` - Procesar nueva señal (se guarda en BD y se emite por WebSocket con `type='signal'`)
- `GET /signals` - Obtener todas las señales (con paginación y filtros de fecha)
- `GET /signals/count` - Contar señales
- `GET /signals/:id` - Obtener señal por ID
- `GET /signals/external/:externalId` - Obtener señales por ID externo

### 6. **Raw Measurements**
Procesamiento y consulta de datos de mediciones sin procesar (datos de series temporales).

- `POST /measurements` - Procesar nueva medición (se guarda en BD y se emite por WebSocket con `type='measurement'`)
- `GET /measurements` - Obtener todas las mediciones (con paginación y filtros de fecha)
- `GET /measurements/count` - Contar mediciones
- `GET /measurements/:id` - Obtener medición por ID
- `GET /measurements/external/:externalId` - Obtener mediciones por ID externo

## 💡 Ejemplos de Uso

### Crear un Área

```http
POST {{baseUrl}}/areas
Content-Type: application/json

{
  "name": "Production Floor A"
}
```

### Crear un Dispositivo

```http
POST {{baseUrl}}/devices
Content-Type: application/json

{
  "name": "Temperature Sensor 01",
  "areaId": 1,
  "externalId": "TEMP-SENSOR-001"
}
```

### Procesar una Señal

```http
POST {{baseUrl}}/signals
Content-Type: application/json

{
  "id": "TEMP_SENSOR_001",
  "value": "25.5"
}
```

### Obtener Dispositivos con Filtros

```http
GET {{baseUrl}}/devices?areaId=1&limit=20&offset=0
```

### Filtrar por Rango de Fechas

```http
GET {{baseUrl}}/signals?externalId=TEMP_SENSOR_001&startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z&limit=100
```

## 🔍 Características de los Endpoints

### Paginación

La mayoría de los endpoints GET que retornan listas soportan paginación:

- `limit` (default: 10) - Número de resultados por página
- `offset` (default: 0) - Número de resultados a saltar

**Ejemplo:**
```
GET /devices?limit=20&offset=40
```
Esto retornará 20 dispositivos, saltándose los primeros 40 (página 3).

### Filtros

Muchos endpoints soportan filtros específicos:

#### Areas & Departments
- `name` - Filtrar por nombre

#### Devices
- `name` - Filtrar por nombre
- `areaId` - Filtrar por ID de área
- `externalId` - Filtrar por ID externo

#### Device Signals
- `name` - Filtrar por nombre
- `deviceId` - Filtrar por ID de dispositivo
- `departmentId` - Filtrar por ID de departamento
- `externalValueId` - Filtrar por ID de valor externo

#### Raw Signals & Measurements
- `externalId` - Filtrar por ID externo
- `startDate` - Fecha de inicio (formato ISO 8601)
- `endDate` - Fecha de fin (formato ISO 8601)

### Soft Delete

Todos los recursos principales soportan eliminación suave (soft delete):

- `DELETE /:id` - Marca el registro como eliminado (establece `deletedAt`)
- `PATCH /:id/restore` - Restaura un registro eliminado
- `includeDeleted=true` - Query parameter para incluir registros eliminados en las consultas

## 📊 Formato de Respuestas

### Respuesta Exitosa (Lista)

```json
{
  "message": "Resources retrieved successfully",
  "data": [...],
  "total": 100,
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 100
  }
}
```

### Respuesta Exitosa (Único)

```json
{
  "message": "Resource retrieved successfully",
  "data": {...}
}
```

### Respuesta de Creación

```json
{
  "message": "Resource created successfully",
  "data": {...}
}
```

## 🌐 WebSocket Events

El backend emite eventos WebSocket para señales y mediciones en tiempo real:

### Evento: `new_raw_signal`
Emitido cuando se procesa una nueva señal.

```json
{
  "event": "new_raw_signal",
  "data": {
    "type": "signal",
    "data": {
      "id": 1,
      "externalId": "TEMP_SENSOR_001",
      "value": "25.5",
      "createdAt": "2024-10-09T12:00:00Z"
    }
  },
  "timestamp": "2024-10-09T12:00:00Z"
}
```

### Evento: `new_raw_measurement`
Emitido cuando se procesa una nueva medición.

```json
{
  "event": "new_raw_measurement",
  "data": {
    "type": "measurement",
    "data": {
      "id": 1,
      "externalId": "PRESSURE_SENSOR_001",
      "value": "101.3",
      "createdAt": "2024-10-09T12:00:00Z"
    }
  },
  "timestamp": "2024-10-09T12:00:00Z"
}
```

## 🛠️ Tips y Mejores Prácticas

### 1. Usa Variables de Postman

En lugar de valores hardcodeados, usa variables de Postman para IDs y otros valores que cambien frecuentemente:

```json
{
  "areaId": {{areaId}},
  "deviceId": {{deviceId}}
}
```

### 2. Guarda Respuestas como Variables

Usa Tests en Postman para guardar IDs de respuestas:

```javascript
// En la pestaña "Tests" de una request
var jsonData = pm.response.json();
pm.environment.set("deviceId", jsonData.data.id);
```

### 3. Organiza tus Requests

Crea colecciones personalizadas para flujos de trabajo específicos:
- Setup (crear areas, departments, devices)
- Testing (probar signals y measurements)
- Cleanup (eliminar datos de prueba)

### 4. Usa Pre-request Scripts

Para generar datos dinámicos:

```javascript
// En la pestaña "Pre-request Script"
pm.environment.set("timestamp", new Date().toISOString());
pm.environment.set("randomValue", Math.random() * 100);
```

## 📝 Validaciones de Datos

### Areas & Departments
- `name`: **requerido**, string, no vacío

### Devices
- `name`: **requerido**, string, no vacío
- `areaId`: **requerido**, number, positivo
- `externalId`: **requerido**, string, no vacío

### Device Signals
- `name`: **requerido**, string, no vacío
- `deviceId`: **requerido**, number, positivo
- `departmentId`: **requerido**, number, positivo
- `externalValueId`: **requerido**, string, no vacío

### Raw Signals & Measurements
- `id`: **requerido**, string, no vacío
- `value`: **requerido**, string, no vacío

## 🐛 Troubleshooting

### Error: "Cannot connect to server"
- Verifica que el backend esté corriendo (`npm run start:dev`)
- Confirma que la variable `baseUrl` sea correcta
- Revisa el puerto en el archivo `.env`

### Error: 404 Not Found
- Verifica la ruta del endpoint
- Asegúrate de estar usando el método HTTP correcto

### Error: 400 Bad Request
- Revisa el formato del body JSON
- Verifica que todos los campos requeridos estén presentes
- Confirma que los tipos de datos sean correctos

### Error: 500 Internal Server Error
- Revisa los logs del backend
- Verifica que la base de datos esté corriendo
- Confirma que las migraciones estén aplicadas

## 📖 Recursos Adicionales

- [Documentación de Postman](https://learning.postman.com/docs/getting-started/introduction/)
- [Variables en Postman](https://learning.postman.com/docs/sending-requests/variables/)
- [Scripts en Postman](https://learning.postman.com/docs/writing-scripts/intro-to-scripts/)

## 🤝 Contribuciones

Si encuentras algún error o tienes sugerencias para mejorar la colección:

1. Actualiza los archivos JSON en `backend-receptor/`
2. Documenta los cambios en este README
3. Comparte la colección actualizada con el equipo

---

**Última actualización:** 2024-10-09  
**Versión de la API:** 1.0.0  
**Mantenido por:** Track.IO Team


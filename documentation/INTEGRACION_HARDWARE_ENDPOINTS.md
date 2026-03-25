# Guía de Integración de Hardware - Endpoints de Datos

> Documento para el equipo de integración de hardware que envía datos al sistema Track.IO mediante los endpoints de señales y mediciones, y que recibe los resultados procesados en un endpoint (puerto 1880).

---

## Resumen de Endpoints

### Entrada (hardware → Track.IO)

El equipo de integración envía datos hacia estos endpoints:

El sistema Track.IO expone dos endpoints principales para recibir datos de dispositivos IoT y sensores:

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/signals` | POST | Recibir señales de estado (ej. paro, marcha, alarma) |
| `/raw-measurements` | POST | Recibir mediciones numéricas (ej. temperatura, presión, nivel) |

### Salida (Track.IO → integración / Node-RED)

Track.IO envía resultados hacia un endpoint configurable (por defecto puerto 1880):

| URL | Propósito |
|-----|-----------|
| `http://localhost:1880/events` | Recibir alertas, señales de torreta y mensajes de escalamiento |

---

## Endpoint de salida: donde Track.IO envía los resultados

El sistema Track.IO **envía** los resultados procesados (alertas, señales de torreta, mensajes de escalamiento) hacia un endpoint externo. Este endpoint suele estar en **puerto 1880**, típicamente usado por Node-RED u otro sistema de integración.

### URL del endpoint de salida

| Entorno | URL |
|---------|-----|
| **Desarrollo (local)** | `http://localhost:1880/events` |
| **Docker** | `http://host.docker.internal:1880/events` |
| **Configurable** | La URL puede configurarse por escalamiento de alertas en el dashboard |

### Método y formato

- **Método:** `POST`
- **Headers:** `Content-Type: application/json`
- **Body:** Siempre un objeto con un array `data`:

```json
{
  "data": [
    { "type": "torreta", "torreta": "string", "color": "string" },
    { "type": "receptor", "capcode": "string", "message": "string" },
    { "type": "email", "email": "string", "message": "string" }
  ]
}
```

### Tipos de payload que recibe el endpoint

| Tipo | Campos | Cuándo se envía |
|------|--------|-----------------|
| `torreta` | `torreta` (externalId de torreta), `color` (ej. R1, Y1, G1) | Cambios de estado de eventos (open/in-progress/closed) o alertas configuradas para torreta |
| `receptor` | `capcode`, `message` | Alertas o escalamiento configurados para receptor (pager) |
| `email` | `email`, `message` | Alertas o escalamiento configurados para envío por correo |

### Ejemplo de payload recibido

```json
{
  "data": [
    {
      "type": "torreta",
      "torreta": "TORRETA_001",
      "color": "R1"
    },
    {
      "type": "receptor",
      "capcode": "12345",
      "message": "Alerta: Temperatura PFC1_M3_TEMP1 fuera de rango"
    }
  ]
}
```

### Cuándo se envían datos a este endpoint

1. **Señales de torreta:** Cuando un evento cambia de estado (nuevo evento, en progreso, cerrado) y hay torretas configuradas para el área.
2. **Alertas de mediciones:** Cuando una medición supera umbrales o ventanas configuradas y hay mensajes (torreta, receptor, email) asociados.
3. **Escalamiento de eventos:** Cuando un evento cumple tiempos de escalamiento y hay mensajes configurados.

### Requisitos para el receptor

- El servicio en puerto 1880 debe aceptar peticiones `POST` en la ruta `/events`.
- Debe responder con un código 2xx para indicar éxito (el backend usa timeout de 5 segundos).
- Si no responde o falla, Track.IO registra el error pero no reintenta automáticamente.

---

## 1. Endpoint de Señales: `POST /signals`

### Descripción

Recibe señales de estado provenientes de dispositivos físicos. Las señales representan cambios de estado discretos (por ejemplo: máquina en marcha, máquina parada, alarma activa).

### URL base

- **Desarrollo (backend directo):** `http://localhost:3000/signals`
- **Con proxy nginx:** `http://localhost/api/signals`
- **Producción:** `https://api.track-io.com/signals` (o la URL configurada)

### Request

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "id": "string",
  "value": "string"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|------------|-------------|
| `id` | string | Sí | Identificador externo del **dispositivo**. Debe coincidir con el `externalId` del dispositivo registrado en el sistema. |
| `value` | string | Sí | Identificador externo del **valor de la señal**. Debe coincidir con el `externalValueId` de la señal configurada para ese dispositivo. |

### Ejemplo de request

```json
{
  "id": "DEV001",
  "value": "VAL_PARO"
}
```

### Respuesta exitosa (201 Created)

```json
{
  "message": "Signal processed successfully",
  "data": {
    "id": 123,
    "externalId": "DEV001",
    "value": "VAL_PARO",
    "createdAt": "2025-03-19T10:30:00.000Z"
  }
}
```

### Cómo funciona internamente

1. **Almacenamiento:** La señal se guarda en la tabla `raw_signals`.
2. **Relación con dispositivo:** El sistema busca un dispositivo con `externalId` igual a `id`. Si existe, busca una señal configurada (`device_signal`) cuyo `externalValueId` coincida con `value` para ese dispositivo.
3. **Eventos:** Si se encuentra dispositivo y señal configurada, se crea o actualiza un evento (open → in-progress → closed) según la lógica de ciclo de vida.
4. **WebSocket:** Se emite un evento `new_raw_signal` a los clientes conectados en tiempo real.
5. **Efectos secundarios:** Se actualizan tiempos de paro por área, se evalúan torretas y alertas de escalamiento.

### Requisitos previos

- El **dispositivo** debe estar registrado en el sistema con el mismo `externalId` que se envía en `id`.
- La **señal del dispositivo** (`device_signal`) debe existir con el mismo `externalValueId` que se envía en `value`, asociada a ese dispositivo.

Si el dispositivo o la señal no existen, la petición se procesa igual (se guarda la señal cruda), pero no se generarán eventos ni actualizaciones de paros.

---

## 2. Endpoint de Mediciones: `POST /raw-measurements`

### Descripción

Recibe mediciones numéricas provenientes de sensores (temperatura, humedad, presión, nivel, flujo, etc.). Estas mediciones se almacenan, se visualizan en dashboards y pueden disparar reglas de alerta.

### URL base

- **Desarrollo (backend directo):** `http://localhost:3000/raw-measurements`
- **Con proxy nginx:** `http://localhost/api/raw-measurements`
- **Producción:** `https://api.track-io.com/raw-measurements` (o la URL configurada)

### Request

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "id": "string",
  "value": "string"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|------------|-------------|
| `id` | string | Sí | Identificador externo de la **medición**. Debe coincidir con el `externalId` de la medición registrada en el sistema. |
| `value` | string | Sí | Valor numérico de la medición como string (ej. `"25.5"`, `"0.85"`, `"120"`). |

### Ejemplo de request

```json
{
  "id": "PFC1_M3_TEMP1",
  "value": "72.5"
}
```

### Respuesta exitosa (201 Created)

```json
{
  "message": "Measurement processed successfully",
  "data": {
    "id": 456,
    "externalId": "PFC1_M3_TEMP1",
    "value": "72.5",
    "createdAt": "2025-03-19T10:30:00.000Z"
  }
}
```

### Cómo funciona internamente

1. **Almacenamiento:** La medición se guarda en la tabla `raw_measurements`.
2. **Valor de medición:** Si existe una medición configurada con ese `externalId`, se guarda el valor en `measurement_values` para historial y gráficas.
3. **WebSocket:** Se emite un evento `new_raw_measurement` a los clientes conectados.
4. **Alertas:** Se evalúan las reglas de alerta configuradas para esa medición (umbrales, ventanas, etc.). Si se cumple alguna condición, se disparan las alertas correspondientes.

### Requisitos previos

- La **medición** debe estar registrada en el sistema con el mismo `externalId` que se envía en `id`.

Si la medición no existe, la petición se procesa igual (se guarda la medición cruda), pero no se guardará en el historial de valores ni se evaluarán alertas.

---

## Validación y Errores

### Validación de entrada

- `id` y `value` son **obligatorios** y deben ser strings no vacíos.
- Cualquier campo adicional en el body será ignorado (whitelist activa).

### Errores comunes

| Código | Causa |
|--------|-------|
| 400 Bad Request | Body inválido, campos faltantes o tipos incorrectos |
| 201 Created | Petición procesada correctamente (incluso si dispositivo/medición no existen en configuración) |

### Ejemplo de error de validación

```json
{
  "statusCode": 400,
  "message": [
    "id must be a string",
    "value is required"
  ],
  "error": "Bad Request"
}
```

---

## Recomendaciones para el Equipo de Integración

1. **Identificadores consistentes:** Usar siempre los mismos `id` y `value` que están configurados en Track.IO. Coordinar con el equipo de configuración para obtener el mapeo dispositivo/senal y medición.

2. **Formato de valor en mediciones:** Enviar el valor como string numérico. Ejemplos válidos: `"25.5"`, `"0"`, `"-10.2"`.

3. **Frecuencia:** No hay límite explícito de tasa. Enviar datos según la necesidad del negocio (cada segundo, cada minuto, etc.).

4. **Reintentos:** En caso de fallo de red, implementar reintentos con backoff exponencial.

5. **Content-Type:** Siempre enviar `Content-Type: application/json`.

6. **Autenticación:** Actualmente estos endpoints no requieren autenticación. Si en el futuro se añade, se documentará en esta guía.

---

## Resumen de Mapeo de Identificadores

| Endpoint | Campo `id` | Campo `value` |
|----------|------------|---------------|
| `POST /signals` | `externalId` del **Device** | `externalValueId` del **DeviceSignal** |
| `POST /raw-measurements` | `externalId` del **Measurement** | Valor numérico (string) |

---

## Contacto y Soporte

Para dudas sobre la configuración de dispositivos, señales o mediciones en el sistema, contactar al equipo de desarrollo de Track.IO.

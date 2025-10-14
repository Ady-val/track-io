# 🧪 Guía de Testing - Track.IO Backend API

## 📦 Importar Colección de Postman

1. Abre Postman
2. Click en **Import**
3. Selecciona el archivo: `backend-receptor/Track.IO-API.postman_collection.json`
4. La colección "Track.IO Backend API" aparecerá con **107 endpoints**

---

## 🚀 Flujo de Pruebas Recomendado

### **PASO 1: Setup Básico (Infraestructura)**

#### 1.1 Crear un Área

```http
POST /areas
{
  "name": "Production Floor A"
}
```

**Respuesta:** `{ "data": { "id": 1, "name": "Production Floor A", ... } }`

#### 1.2 Crear un Departamento

```http
POST /departments
{
  "name": "Quality Control"
}
```

#### 1.3 Crear un Device

```http
POST /devices
{
  "name": "Temperature Sensor 01",
  "areaId": 1,
  "externalId": "TEMP-SENSOR-001"
}
```

---

### **PASO 2: Configurar Measurements**

#### 2.1 Crear Measurement

```http
POST /measurements
{
  "externalId": "TEMP-SENSOR-001",
  "name": "Main Boiler Temperature",
  "type": "temperature"
}
```

**Nota:** El `externalId` debe coincidir con el `externalId` del device

#### 2.2 Crear Dashboard Configuration

```http
POST /dashboard-measurements
{
  "measurementId": 1,
  "minValue": 0,
  "maxValue": 100
}
```

---

### **PASO 3: Sistema de Alertas**

#### 3.1 Crear Message Group

```http
POST /message-groups
{
  "name": "High Temperature Alerts",
  "description": "Notifications for high temperature events"
}
```

#### 3.2 Crear Alert Rule (Setpoint)

```http
POST /alert-rules
{
  "name": "High Temperature Alert",
  "description": "Alert when temperature exceeds 75°C",
  "measurementId": 1,
  "messageGroupId": 1,
  "mode": "setpoint",
  "operator": ">",
  "setpoint": 75.0,
  "isEnabled": true
}
```

#### 3.3 Crear Alert Rule (Window)

```http
POST /alert-rules
{
  "name": "Temperature Out of Range",
  "description": "Alert when temperature is outside safe range",
  "measurementId": 1,
  "messageGroupId": 1,
  "mode": "window",
  "minValue": 20.0,
  "maxValue": 30.0,
  "isEnabled": true
}
```

---

### **PASO 4: Configurar Receptores**

#### 4.1 Crear Torreta

```http
POST /torretas
{
  "name": "Production Floor Torreta",
  "description": "Main signal tower",
  "isActive": true
}
```

#### 4.2 Ver Colores Disponibles

```http
GET /torreta-colors
```

**Respuesta:** 8 colores predefinidos (Red, Orange, Yellow, Green, Blue, White, Off, Multi-color)

#### 4.3 Crear Receptor

```http
POST /receptors
{
  "externalId": "RCP-001",
  "name": "Production Floor Receptor",
  "description": "Main message receptor",
  "isActive": true
}
```

---

### **PASO 5: Agregar Mensajes a Alert Rules**

#### 5.1 Mensaje Telegram

```http
POST /alert-messages/alert-rule/1
{
  "alertRuleId": 1,
  "receptorType": "telegram",
  "messageData": {
    "telegram": {
      "title": "🌡️ High Temperature Alert",
      "text": "Temperature has exceeded the safe threshold!"
    }
  },
  "messageGroupId": 1
}
```

#### 5.2 Mensaje Torreta

```http
POST /alert-messages/alert-rule/1
{
  "alertRuleId": 1,
  "receptorType": "torreta",
  "messageData": {
    "torreta": {
      "torretaId": 1,
      "colorId": 1
    }
  },
  "messageGroupId": 1
}
```

#### 5.3 Mensaje Email

```http
POST /alert-messages/alert-rule/1
{
  "alertRuleId": 1,
  "receptorType": "correo",
  "messageData": {
    "correo": {
      "emails": ["admin@company.com", "supervisor@company.com"],
      "subject": "High Temperature Alert",
      "message": "The temperature sensor has detected a value above threshold."
    }
  },
  "messageGroupId": 1
}
```

#### 5.4 Mensaje Receptor

```http
POST /alert-messages/alert-rule/1
{
  "alertRuleId": 1,
  "receptorType": "receptor",
  "messageData": {
    "receptor": {
      "receptorId": 1,
      "message": "High temperature detected"
    }
  },
  "messageGroupId": 1
}
```

**⚠️ Límite:** Máximo 5 mensajes por Alert Rule

---

### **PASO 6: 🎯 PROBAR EL SISTEMA COMPLETO**

#### 6.1 Enviar Raw Measurement (Valor Normal)

```http
POST /raw-measurements
{
  "id": "TEMP-SENSOR-001",
  "value": "25.5"
}
```

**Lo que sucede:**

1. ✅ Se guarda en `raw_measurements`
2. ✅ Se guarda en `measurement_values` (porque existe measurement con ese externalId)
3. 📡 **Se emite WebSocket:** `new_measurement_value`
   ```json
   {
     "type": "measurement_value",
     "data": {
       "measurementId": 1,
       "value": "25.5",
       "createdAt": "2024-01-..."
     }
   }
   ```
4. ✅ Se evalúan alert rules (no se dispara porque está bajo 75°C)

#### 6.2 Enviar Raw Measurement (Valor que Dispara Alerta)

```http
POST /raw-measurements
{
  "id": "TEMP-SENSOR-001",
  "value": "80.5"
}
```

**Lo que sucede:**

1. ✅ Se guarda en `raw_measurements`
2. ✅ Se guarda en `measurement_values`
3. 📡 **Se emite WebSocket:** `new_measurement_value`
4. 🚨 **Se DISPARA ALERTA** (80.5 > 75.0)
5. ✅ Se crea registro en `alert_triggers`
6. 📱 Se ejecutan los 4 mensajes (console.log en servidor)
7. 📡 **Se emite WebSocket:** `alert_triggered`

**Revisa la consola del servidor para ver:**

```bash
📱 TELEGRAM: { title: '🌡️ High Temperature Alert', ... }
🚨 TORRETA: { torretaId: 1, colorId: 1, ... }
📧 CORREO: { emails: [...], subject: '...', ... }
📟 RECEPTOR: { receptorId: 1, message: '...', ... }
```

---

### **PASO 7: Ver Resultados**

#### 7.1 Ver Historial de Triggers

```http
GET /alert-triggers/alert-rule/1
```

#### 7.2 Ver Estadísticas de Alert Rule

```http
GET /alert-triggers/alert-rule/1/stats
```

**Respuesta:**

```json
{
  "data": {
    "totalTriggers": 1,
    "lastTriggeredAt": "2024-01-...",
    "avgValue": 80.5,
    "minValue": 80.5,
    "maxValue": 80.5
  }
}
```

#### 7.3 Ver Últimos Measurement Values

```http
GET /measurements/1/values?limit=10
```

---

## 📊 Resumen de Módulos

| Módulo                     | Endpoints  | Descripción                         |
| -------------------------- | ---------- | ----------------------------------- |
| Areas                      | 7          | Gestión de áreas                    |
| Departments                | 7          | Gestión de departamentos            |
| Devices                    | 10         | Gestión de dispositivos IoT         |
| Device Signals             | 12         | Mapeo de señales de dispositivos    |
| Measurements               | 8          | Definiciones de mediciones          |
| **Dashboard Measurements** | **6**      | **Configuración de dashboards**     |
| Raw Signals                | 5          | Procesamiento de señales crudas     |
| Raw Measurements           | 5          | Procesamiento de mediciones crudas  |
| Message Groups             | 5          | Grupos de mensajes de alerta        |
| Alert Rules                | 9          | Reglas de monitoreo                 |
| Alert Messages             | 10         | Mensajes de notificación            |
| Torretas                   | 7          | Dispositivos de torreta             |
| Torreta Colors             | 5          | Colores de torreta (8 predefinidos) |
| Receptors                  | 7          | Dispositivos receptores             |
| Alert Triggers             | 4          | Historial de alertas (read-only)    |
| **TOTAL**                  | **🎉 107** |                                     |

---

## 📡 WebSocket Events

### Conectarse al WebSocket

```javascript
const socket = io('http://localhost:3000');

// Evento: Nuevo raw measurement
socket.on('new_raw_measurement', data => {
  console.log('Raw Measurement:', data);
});

// Evento: Nuevo measurement value ✨ NUEVO
socket.on('new_measurement_value', data => {
  console.log('Measurement Value:', data);
  // { measurementId: 1, value: "25.5", createdAt: "..." }
});

// Evento: Alerta disparada
socket.on('alert_triggered', data => {
  console.log('Alert Triggered:', data);
});
```

---

## 🔧 Comandos Útiles

### Servidor

```bash
npm run start:dev          # Iniciar en modo desarrollo
npm run build              # Compilar proyecto
npm run lint:check         # Verificar errores de linting
```

### Base de Datos

```bash
npm run migration:run      # Ejecutar migraciones pendientes
npm run migration:revert   # Revertir última migración

# Ver tablas
npm run typeorm -- query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"

# Ver migraciones ejecutadas
npm run typeorm -- query "SELECT * FROM migrations ORDER BY id"
```

---

## 🎯 Escenarios de Prueba

### Escenario 1: Dashboard en Tiempo Real

1. Crear measurement
2. Crear dashboard configuration (min: 0, max: 100)
3. Conectar WebSocket y escuchar `new_measurement_value`
4. Enviar raw measurements con diferentes valores
5. Ver actualizaciones en tiempo real

### Escenario 2: Sistema de Alertas Completo

1. Crear measurement
2. Crear 2 alert rules (setpoint y window)
3. Agregar 4 tipos de mensajes a cada rule
4. Enviar valores que disparen las alertas
5. Ver triggers en historial
6. Ver estadísticas de las rules

### Escenario 3: Múltiples Sensors

1. Crear 3 measurements diferentes (temp, humidity, pressure)
2. Configurar dashboard para cada uno
3. Crear alert rules específicas
4. Enviar datos simultáneos
5. Verificar que se evalúen correctamente

---

## 📝 Notas Importantes

### Tipos de Measurement

- `temperature` - Temperatura
- `humidity` - Humedad
- `pressure` - Presión
- `level` - Nivel
- `flow` - Flujo
- `vibration` - Vibración

### Operadores de Alert Rules (Setpoint)

- `>` - Mayor que
- `>=` - Mayor o igual que
- `<` - Menor que
- `<=` - Menor o igual que
- `==` - Igual a
- `!=` - Diferente de

### Modos de Alert Rules

- `setpoint` - Requiere: `operator`, `setpoint`
- `window` - Requiere: `minValue`, `maxValue` (dispara si está FUERA del rango)

### Tipos de Receptores

- `telegram` - Notificación Telegram
- `torreta` - Señal visual en torreta
- `correo` - Notificación por email
- `receptor` - Mensaje a dispositivo receptor

---

## ✅ Checklist de Testing

- [ ] Crear infraestructura básica (Areas, Departments, Devices)
- [ ] Crear measurements con externalId correcto
- [ ] Configurar dashboards (min/max values)
- [ ] Crear alert rules (al menos 1 setpoint y 1 window)
- [ ] Crear torretas y receptores
- [ ] Agregar mensajes a alert rules (probar los 4 tipos)
- [ ] Enviar raw measurements (valores normales)
- [ ] Verificar WebSocket `new_measurement_value`
- [ ] Enviar valores que disparen alertas
- [ ] Verificar console.logs en servidor
- [ ] Verificar WebSocket `alert_triggered`
- [ ] Ver historial de triggers
- [ ] Ver estadísticas de alert rules
- [ ] Probar toggle de alert rules (enable/disable)
- [ ] Probar duplicate de alert messages
- [ ] Probar validaciones (max 5 mensajes, minValue < maxValue, etc.)

---

## 🐛 Troubleshooting

### El servidor no inicia

```bash
# Verificar que la base de datos esté corriendo
docker ps

# Revisar variables de entorno
cat .env

# Reinstalar dependencias
pnpm install
```

### Las alertas no se disparan

- Verificar que la alert rule esté `isEnabled: true`
- Verificar que el `measurementId` coincida
- Verificar que el valor cumpla la condición
- Revisar logs en la consola del servidor

### WebSocket no recibe eventos

- Verificar que el servidor esté corriendo
- Verificar que el puerto sea 3000
- Revisar que el evento esté correctamente suscrito

---

## 📞 Contacto y Soporte

Para problemas o preguntas, revisar los logs del servidor:

```bash
npm run start:dev
```

Los logs mostrarán:

- ✅ Measurements procesados
- 🚨 Alertas disparadas
- 📡 Eventos WebSocket emitidos
- ❌ Errores y validaciones



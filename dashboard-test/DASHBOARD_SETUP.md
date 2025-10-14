# 📊 Dashboard de Mediciones en Tiempo Real

## 🎯 Características

- **Gauge Charts en Tiempo Real**: Visualización tipo velocímetro para cada medición configurada
- **WebSocket**: Actualización automática sin recargar la página
- **Múltiples Tipos de Sensores**: Temperatura, Humedad, Presión, Nivel, Flujo, Vibración
- **Alertas Visuales**: Indicador cuando el valor está fuera de rango
- **Responsive**: Grid adaptable (1-4 columnas según pantalla)
- **Atomic Design**: Componentes reutilizables y hooks personalizados

---

## 🚀 Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` en `dashboard-test/`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 2. Iniciar Servicios

```bash
# Terminal 1: Backend
cd backend-receptor
npm run start:dev

# Terminal 2: Frontend
cd dashboard-test
pnpm run dev
```

---

## 📋 Prerequisitos en Backend

Antes de usar el dashboard, debes tener en el backend:

### 1. **Measurement** configurado

```http
POST /measurements
{
  "externalId": "TEMP-SENSOR-001",
  "name": "Main Boiler Temperature",
  "type": "temperature"
}
```

### 2. **Dashboard Configuration** creada

```http
POST /dashboard-measurements
{
  "measurementId": 1,
  "minValue": 0,
  "maxValue": 100
}
```

---

## 🎮 Uso

1. **Navega a la página:**

   - URL: `http://localhost:5173/dashboard-measurements`
   - O click en el ícono de gauge (⚙️) en el sidebar

2. **El dashboard cargará automáticamente:**

   - Todas las configuraciones de dashboard desde `/dashboard-measurements`
   - Un gauge chart por cada configuración

3. **Envía datos desde el backend:**

   ```http
   POST /raw-measurements
   {
     "id": "TEMP-SENSOR-001",
     "value": "45.5"
   }
   ```

4. **El gauge se actualizará en tiempo real** vía WebSocket

---

## 🎨 Tipos de Mediciones Soportadas

| Tipo          | Ícono | Unidad | Color   | Ejemplo  |
| ------------- | ----- | ------ | ------- | -------- |
| `temperature` | 🌡️    | °C     | Rojo    | 45.5°C   |
| `humidity`    | 💧    | %      | Azul    | 65.0%    |
| `pressure`    | 📊    | Pa     | Morado  | 101.3 Pa |
| `level`       | ↕️    | -      | Verde   | 75.2     |
| `flow`        | 🌊    | L/s    | Cyan    | 12.5 L/s |
| `vibration`   | 〰️    | Hz     | Naranja | 60.0 Hz  |

---

## 🏗️ Arquitectura del Código

### **Hooks Personalizados**

#### `useDashboardMeasurements()`

- Consulta las configuraciones de dashboard del backend
- Retorna: `{ dashboards, loading, error, refetch }`

#### `useRealtimeMeasurementValues()`

- Escucha WebSocket event: `new_measurement_value`
- Mantiene estado de valores actuales por measurementId
- Retorna: `{ values, getValue, getTimestamp }`

### **Componentes**

#### `GaugeChart` (Molécula)

- **Props:**

  - `title` - Nombre del sensor
  - `subtitle` - External ID
  - `value` - Valor actual (opcional)
  - `minValue` - Mínimo del rango
  - `maxValue` - Máximo del rango
  - `type` - Tipo de medición
  - `timestamp` - Última actualización

- **Features:**
  - Gauge semicircular con Chart.js
  - Valor central grande
  - Unidad según tipo de medición
  - Indicador visual si está fuera de rango
  - Rangos min/max en footer

### **Utilidades**

#### `measurementUtils.ts`

- Configuración de íconos, colores y unidades por tipo
- Función `getMeasurementConfig(type)` para obtener configuración

---

## 🔄 Flujo de Datos

```
1. Usuario abre /dashboard-measurements
   ↓
2. useDashboardMeasurements() consulta backend
   GET /dashboard-measurements
   ↓
3. Se renderizan N gauge charts (uno por configuración)
   ↓
4. useRealtimeMeasurementValues() conecta WebSocket
   ↓
5. Backend envía raw measurement
   POST /raw-measurements { id, value }
   ↓
6. Backend guarda y emite WebSocket
   Event: new_measurement_value
   Data: { measurementId, value, createdAt }
   ↓
7. Hook actualiza estado
   values[measurementId] = { value, timestamp }
   ↓
8. GaugeChart re-renderiza con nuevo valor
   (animación suave del gauge)
```

---

## 🎯 Comportamiento del Gauge

### **Valor Normal (dentro de rango)**

- Barra de color según tipo de medición
- Valor en el centro en color blanco
- Sin alertas visuales

### **Valor Fuera de Rango**

- Barra llega al límite (min o max)
- Valor en el centro en color ROJO
- Banner de advertencia: "⚠️ Valor fuera de rango"

### **Sin Datos**

- Muestra "--" en el centro
- Barra en 0%
- Sin timestamp

---

## 🐛 Troubleshooting

### Los gauges no muestran datos

- ✅ Verifica que el backend esté corriendo
- ✅ Verifica que existan dashboard_measurements en la BD
- ✅ Revisa la consola del navegador para errores de API

### Los valores no se actualizan en tiempo real

- ✅ Verifica que el WebSocket esté conectado (indicador verde)
- ✅ Revisa la consola del servidor backend
- ✅ Envía un raw measurement y verifica los logs

### El gauge no se ve correctamente

- ✅ Verifica que Chart.js esté instalado: `pnpm list chart.js`
- ✅ Limpia caché: `pnpm run build` y recarga
- ✅ Revisa errores en consola del navegador

---

## 📚 Recursos

- [Chart.js Documentation](https://www.chartjs.org/)
- [React Chart.js 2](https://react-chartjs-2.js.org/)
- [WebSocket API](https://socket.io/docs/v4/)

---

## ✨ Próximas Mejoras

- [ ] Agregar gráfico histórico (línea temporal)
- [ ] Exportar datos a CSV/Excel
- [ ] Configuración de alertas desde el dashboard
- [ ] Modo pantalla completa para monitoreo
- [ ] Sonido cuando se dispara alerta



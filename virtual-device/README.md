# Virtual Device Simulator

Una aplicación React para simular el envío de datos desde dispositivos virtuales al sistema Track.IO.

## 🚀 Características

- **Selector de Dispositivos Virtuales**: Lista todos los dispositivos virtuales del sistema
- **Información del Dispositivo**: Muestra área, nombre y tipo del dispositivo seleccionado
- **Grid de Departamentos**: Diseño responsive con cards grandes y notorios
- **Envío de Datos**: Implementación completa del envío al endpoint `/signals`
- **Manejo de Errores**: Estados de carga y manejo de errores robusto
- **Datos Reales**: Conectado al backend real de Track.IO

## 🏗️ Arquitectura

La aplicación sigue **Atomic Design** con la siguiente estructura:

```
src/
├── components/
│   ├── atoms/          # Button, Card, Select, Text, Spinner, Checkbox
│   ├── molecules/      # DeviceSelector, DeviceInfo, DepartmentCard
│   ├── organisms/      # DepartmentGrid
│   └── VirtualDeviceApp.tsx
├── hooks/
│   ├── useVirtualDevices.ts
│   └── useSignalSender.ts
├── services/
│   └── api.ts
├── config/
│   └── api.ts
└── types/
    └── index.ts
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# App Configuration
VITE_APP_NAME=Virtual Device Simulator
VITE_APP_VERSION=1.0.0
```

### Backend Requerido

La aplicación requiere que el backend Track.IO esté ejecutándose con:

1. **Endpoint de Devices**: `GET /devices?isVirtualDevice=true`
2. **Endpoint de Signals**: `POST /signals`
3. **Campo isVirtualDevice**: Agregado a la entidad Device

## 📡 API Endpoints

### Obtener Dispositivos Virtuales

```http
GET /devices?isVirtualDevice=true
```

**Respuesta:**

```json
{
  "message": "Devices retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Virtual Device 1",
      "areaId": 1,
      "areaName": "Área Principal",
      "externalId": "VD-001",
      "isVirtualDevice": true,
      "deviceSignals": [
        {
          "id": 1,
          "name": "Temperatura",
          "departmentId": 1,
          "departmentName": "Producción",
          "externalValueId": "TEMP-001"
        }
      ]
    }
  ]
}
```

### Enviar Señal

```http
POST /signals
Content-Type: application/json

{
  "id": "TEMP-001",
  "value": "25.5"
}
```

**Respuesta:**

```json
{
  "message": "Signal processed successfully",
  "data": {
    "id": 123,
    "externalId": "TEMP-001",
    "value": "25.5",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 🎯 Funcionalidades

### 1. Selección de Dispositivo

- Lista todos los dispositivos virtuales del sistema
- Muestra nombre y área del dispositivo
- Carga automática de departamentos asociados

### 2. Información del Dispositivo

- Muestra detalles del dispositivo seleccionado
- Área, nombre y tipo de dispositivo
- ID externo para identificación

### 3. Grid de Departamentos

- Diseño responsive con flex-wrap
- Cards grandes y notorios
- Estados de carga individuales
- Manejo de errores por departamento

### 4. Envío de Datos

- Genera valores aleatorios para simular sensores
- Envía datos al endpoint `/signals`
- Manejo de errores robusto
- Feedback visual durante el envío

## 🛠️ Desarrollo

### Instalación

```bash
npm install
# o
pnpm install
```

### Desarrollo

```bash
npm run dev
# o
pnpm dev
```

### Construcción

```bash
npm run build
# o
pnpm build
```

## 🔍 Hooks Personalizados

### useVirtualDevices

```typescript
const { devices, isLoading, error } = useVirtualDevices();
```

### useSignalSender

```typescript
const { sendSignal, isSending, getError } = useSignalSender();
```

## 🎨 Componentes

### Átomos

- **Button**: Botón con variantes y estados
- **Card**: Contenedor con hover effects
- **Select**: Selector con placeholder
- **Text**: Texto con variantes y colores
- **Spinner**: Indicador de carga

### Moléculas

- **DeviceSelector**: Selector de dispositivos virtuales
- **DeviceInfo**: Información del dispositivo
- **DepartmentCard**: Card de departamento con envío de datos

### Organismos

- **DepartmentGrid**: Grid responsive de departamentos

## 🚨 Manejo de Errores

- **Timeout de requests**: 10 segundos
- **Reintentos automáticos**: No implementados (se pueden agregar)
- **Estados de error**: Por departamento individual
- **Feedback visual**: Mensajes de error en cards

## 📱 Responsive Design

- **Mobile**: 1 columna
- **Tablet**: 2 columnas
- **Desktop**: 3 columnas
- **Large Desktop**: 4 columnas

## 🔗 Integración

La aplicación se integra perfectamente con el ecosistema Track.IO:

1. **Backend**: Usa los mismos endpoints y DTOs
2. **Frontend**: Mismo diseño y componentes que dashboard-test
3. **Tipos**: Compartidos entre aplicaciones
4. **API**: Consistente con el resto del sistema

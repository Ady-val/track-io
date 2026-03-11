# Track.IO - Resumen para Agentes AI

> Documento conciso para que un agente AI comprenda el sistema rápidamente.

## Propósito

**Track.IO** es una plataforma de **monitoreo industrial IoT** que recibe datos de sensores/dispositivos, los procesa y los visualiza en tiempo real. Incluye alertas, tiempos de paro y gestión de equipos.

---

## Arquitectura

```
[IoT / Virtual Device] → POST /signals, /raw-measurements
         ↓
[backend-receptor] ←→ PostgreSQL | SQL Server
         ↓
    REST API + WebSocket
         ↓
[dashboard-test] → Usuario
```

---

## backend-receptor (NestJS)

**Stack:** NestJS, TypeORM, PostgreSQL/SQL Server, Socket.IO, JWT

### Flujo de datos entrantes

1. `POST /signals` o `POST /signals/virtual-device` → guarda `RawSignal`, emite WebSocket
2. `POST /raw-measurements` → guarda `RawMeasurement`, emite WebSocket
3. Cada señal dispara: eventos (open→in-progress→closed), area-downtime, alertas, torretas

### Módulos principales

| Módulo | Función |
|--------|---------|
| **signals** | Recibe señales, procesa eventos, emite WebSocket |
| **raw-measurements** | Recibe mediciones |
| **devices** | CRUD dispositivos (área, externalId, isVirtualDevice) |
| **device-signals** | Señales por dispositivo (externalValueId) |
| **areas, departments** | Estructura organizacional |
| **events** | Estados open/in-progress/closed, reason, comment |
| **alert-rules, alert-messages, alert-triggers** | Reglas de alerta (setpoint/ventana) |
| **alert-escalation** | Escalamiento de alertas |
| **dashboard-measurements** | Grupos de mediciones para dashboards |
| **area-downtime** | Tiempos de paro por área |
| **area-torreta-config** | Configuración torretas por área |
| **auth, permissions, users** | JWT, roles, permisos por módulo |
| **websocket** | Eventos: `new_raw_signal`, `new_raw_measurement`, `new-event`, `event-updated`, `closed-event` |

### Endpoints clave

- `POST /signals` → `{ id, value }` (id=externalId dispositivo, value=externalValueId señal)
- `POST /signals/virtual-device` → `{ id, value, reason?, comment? }`
- `GET /devices?isVirtualDevice=true` → dispositivos virtuales
- `GET /raw-measurements`, `GET /signals` → listado con filtros

### Entidades principales

- **Device**: name, areaId, externalId, isVirtualDevice
- **DeviceSignal**: name, departmentId, externalValueId
- **RawSignal**: externalId, value
- **RawMeasurement**: externalId, value, virtualDevice
- **Event**: areaId, deviceId, deviceSignalId, status, virtualDevice, reason, comment

---

## dashboard-test (React + Vite)

**Stack:** React 18, Vite, Tailwind, HeroUI, TanStack Query, Socket.IO Client, Chart.js

### Rutas /dashboard

| Ruta | Contenido |
|------|-----------|
| `/dashboard/alerts` | Reglas de alerta (condiciones de monitoreo) |
| `/dashboard/measurements` | Mediciones en tiempo real |
| `/dashboard/signals` | Señales crudas |
| `/dashboard/industrial` | Dashboard industrial (torretas) |
| `/dashboard/downtimes` | Tiempos de paro por área |
| `/dashboard/devices` | CRUD dispositivos y señales |
| `/dashboard/catalogs` | Áreas, colores torreta, emails, etc. |
| `/dashboard/users` | Usuarios |
| `/dashboard/roles` | Roles y permisos |

### Permisos

- Control por módulo (Module) y acción (Action)
- `useHasPermission(Module, Action)` para proteger UI
- `PermissionProtectedRoute` para rutas

### Tiempo real

- Socket.IO conectado al backend
- `useWebSocketEvent`, `useRealtimeMeasurementValues` para actualizaciones

---

## virtual-device

Simulador que envía señales al backend sin hardware IoT. Usa `POST /signals/virtual-device` con reason/comment para reportar paros manuales. Los eventos se integran igual que los de dispositivos físicos.

---

## Estructura de carpetas

```
track-io/
├── backend-receptor/     # API NestJS
├── dashboard-test/       # Frontend React
├── virtual-device/      # Simulador
├── docker/              # Docker Compose
└── PROJECT_OVERVIEW.md  # Este archivo
```

---

## Variables de entorno (backend-receptor)

- `DATABASE_TYPE`: postgres | mssql
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- `JWT_SECRET`, `NODE_ENV`

---

## Comandos rápidos

```bash
# Backend
cd backend-receptor && pnpm run start:dev

# Dashboard
cd dashboard-test && pnpm run dev

# Virtual Device
cd virtual-device && pnpm run dev
```

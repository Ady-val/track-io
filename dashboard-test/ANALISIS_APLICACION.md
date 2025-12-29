# Análisis de la Aplicación Dashboard-Test

## 📁 Estructura de Archivos

### Organización General

La aplicación sigue una arquitectura modular basada en React con TypeScript, organizada en las siguientes carpetas principales:

```
dashboard-test/
├── src/
│   ├── components/          # Componentes React organizados por atomic design
│   │   ├── atoms/          # Componentes básicos reutilizables
│   │   ├── molecules/     # Componentes compuestos
│   │   ├── organisms/     # Componentes complejos con lógica de negocio
│   │   ├── templates/     # Plantillas de layout
│   │   ├── layouts/       # Layouts principales
│   │   ├── auth/          # Componentes de autenticación
│   │   └── providers/     # Providers de contexto
│   ├── pages/             # Páginas principales de la aplicación
│   ├── hooks/             # Custom hooks para lógica reutilizable
│   ├── lib/               # Utilidades y servicios
│   │   ├── services/     # Servicios de API
│   │   └── utils/        # Funciones utilitarias
│   ├── contexts/          # Contextos de React (Auth, Permissions, WebSocket)
│   ├── config/            # Configuraciones (rutas, colores, etc.)
│   ├── constants/         # Constantes de la aplicación
│   └── types/             # Definiciones de tipos TypeScript
├── public/                # Archivos estáticos
└── package.json          # Dependencias y scripts
```

## 🏗️ Arquitectura de Componentes

### Patrón Atomic Design

La aplicación utiliza el patrón **Atomic Design** para organizar componentes:

1. **Atoms** (`components/atoms/`): Componentes básicos e indivisibles

   - Button, Input, Card, Icon, Spinner, etc.
   - No contienen lógica de negocio, solo UI

2. **Molecules** (`components/molecules/`): Combinaciones de atoms

   - FormField, DataTable, Sidebar, Charts (MeasurementChart, LevelChart, etc.)
   - Contienen lógica de presentación básica

3. **Organisms** (`components/organisms/`): Componentes complejos

   - DevicesTable, EventsTable, CreateDeviceModal, AlertRuleDetailModal
   - Contienen lógica de negocio y estado

4. **Templates** (`components/templates/`): Plantillas de layout

   - TwoColumnLayout, DashboardTemplate
   - Definen la estructura de páginas

5. **Pages** (`pages/`): Páginas completas
   - IndustrialDashboard, DevicesPage, CatalogsPage, etc.
   - Orquestan múltiples organisms y molecules

## 🔌 Conexión con el Backend

### 1. Cliente HTTP (REST API)

**Archivo**: `src/lib/api.ts`

- Utiliza **Axios** como cliente HTTP
- Configuración base URL desde variable de entorno `VITE_API_URL`
- **Interceptores**:
  - **Request**: Agrega token JWT automáticamente desde `localStorage`
  - **Response**: Maneja errores 401 (no autorizado) redirigiendo al login
- Timeout configurado a 10 segundos

### 2. Servicios de API

**Carpeta**: `src/lib/services/`

Cada entidad tiene su propio servicio que encapsula las llamadas al backend:

- `auth.service.ts` - Autenticación y login
- `device.service.ts` - CRUD de dispositivos
- `device-signal.service.ts` - Gestión de señales de dispositivos
- `measurement.service.ts` - Mediciones
- `alertRule.service.ts` - Reglas de alerta
- `alertMessage.service.ts` - Mensajes de alerta
- `area.service.ts` - Áreas
- `areaDowntime.service.ts` - Tiempos de paro
- `dashboard.service.ts` - Dashboard
- `receptor.service.ts` - Receptores
- `messageGroup.service.ts` - Grupos de mensajes
- `torretaColor.service.ts` - Colores de torreta
- `areaTorretaConfig.service.ts` - Configuración área-torreta
- `dashboard-measurement-group.service.ts` - Grupos de mediciones del dashboard
- `escalation.service.ts` - Escalación de alertas

**Patrón de Servicios**:

```typescript
class ServiceName {
  private readonly baseUrl = "/endpoint";

  async getAll(): Promise<ResponseType> { ... }
  async getById(id: number): Promise<ResponseType> { ... }
  async create(data: CreateData): Promise<ResponseType> { ... }
  async update(id: number, data: UpdateData): Promise<ResponseType> { ... }
  async delete(id: number): Promise<ResponseType> { ... }
}
```

### 3. WebSocket (Tiempo Real)

**Archivos**:

- `src/lib/socket.ts` - Instancia de Socket.IO
- `src/contexts/WebSocketContext.tsx` - Contexto React para WebSocket

**Características**:

- Utiliza **Socket.IO Client** para comunicación en tiempo real
- Conexión automática al montar el componente
- Reconexión automática (5 intentos, delay de 1 segundo)
- Eventos escuchados:
  - `new-event` - Nuevo evento creado
  - `event-updated` - Evento actualizado
  - `closed-event` - Evento cerrado
  - Y otros eventos personalizados según el módulo

### 4. Gestión de Estado

**React Query** (`@tanstack/react-query`):

- Cache de datos con staleTime de 5 minutos
- Refetch automático en reconexión
- Manejo de errores y reintentos
- Mutaciones optimistas

**Contextos React**:

- `AuthContext` - Estado de autenticación (token, usuario)
- `PermissionsContext` - Permisos del usuario
- `WebSocketContext` - Estado de conexión WebSocket

## 🧩 Lógica de Negocio

### 1. Autenticación y Autorización

- **JWT**: Tokens almacenados en `localStorage`
- **Protected Routes**: Rutas protegidas con componentes wrapper
  - `ProtectedRoute` - Requiere autenticación
  - `AdminProtectedRoute` - Requiere usuario ADMIN
  - `PermissionProtectedRoute` - Requiere permiso específico
- **Sistema de Permisos**: Basado en módulos y acciones (CREATE, READ, UPDATE, DELETE)

### 2. Custom Hooks

Los hooks encapsulan la lógica de negocio y comunicación con el backend:

- `useDevices` - Gestión de dispositivos
- `useAlertRules` - Reglas de alerta
- `useDashboard` - Datos del dashboard industrial
- `useMeasurements` - Mediciones
- `useAreas` - Áreas
- `useUsers` - Usuarios
- `useRoles` - Roles y permisos
- `useHasPermission` - Verificación de permisos
- `useWebSocketEvent` - Escucha eventos WebSocket
- `useNotifications` - Sistema de notificaciones toast

### 3. Formularios

- Utiliza **React Hook Form** con validación **Zod**
- Formularios modales para crear/editar entidades
- Manejo de errores de validación y del servidor

### 4. Visualización de Datos

- **Chart.js** con `react-chartjs-2` para gráficos
- Tipos de gráficos:
  - MeasurementChart - Gráficos de mediciones
  - LevelChart - Gráficos de nivel
  - VibrationLineChart - Gráficos de vibración
  - HorizontalBarChart - Gráficos de barras horizontales
  - GaugeChart - Gráficos tipo gauge

## 📋 Módulos del Sidebar

La aplicación tiene **9 módulos principales** en el sidebar, cada uno con sus propias funcionalidades:

### 1. 🚨 **Alertas** (`/dashboard/alerts`)

**Icono**: FaChartLine  
**Permiso requerido**: `MEASUREMENT_ALERTS - READ`

**Descripción**:  
Módulo de monitoreo y gestión de condiciones de alerta. Permite crear, editar y administrar reglas de alerta que se activan cuando las mediciones de los sensores superan umbrales configurados. Incluye gestión de mensajes de alerta, configuración de escalación y visualización de reglas activas.

**Funcionalidades principales**:

- Crear/editar/eliminar reglas de alerta
- Configurar condiciones (setpoint o ventana)
- Asociar mensajes a reglas
- Habilitar/deshabilitar reglas
- Visualización de reglas en tarjetas compactas

---

### 2. 📊 **Mediciones** (`/dashboard/measurements`)

**Icono**: FaGaugeHigh  
**Permiso requerido**: `MEASUREMENTS - READ`

**Descripción**:  
Dashboard de mediciones que permite visualizar y gestionar grupos de mediciones. Los usuarios pueden crear grupos personalizados de mediciones del dashboard, organizarlos y visualizarlos con gráficos en tiempo real.

**Funcionalidades principales**:

- Crear grupos de mediciones
- Agregar mediciones a grupos
- Visualización de gráficos en tiempo real
- Gestión de grupos personalizados

---

### 3. 📡 **Señales** (`/dashboard/signals`)

**Icono**: PiWaveSineBold  
**Permiso requerido**: Solo usuario ADMIN

**Descripción**:  
Módulo avanzado para visualización de señales en tiempo real. Permite a los administradores monitorear las señales raw de los dispositivos, útil para debugging y análisis técnico.

**Funcionalidades principales**:

- Visualización de señales en tiempo real
- Filtrado y búsqueda de señales
- Análisis de señales por dispositivo

---

### 4. 🏭 **Dashboard Industrial** (`/dashboard/industrial`)

**Icono**: FaIndustry  
**Permiso requerido**: Acceso general (sin permiso específico)

**Descripción**:  
Dashboard principal de producción industrial que muestra una vista general del estado de las líneas de producción. Visualiza áreas, eventos abiertos, en progreso y cerrados, con actualización en tiempo real mediante WebSocket.

**Funcionalidades principales**:

- Vista de líneas de producción (áreas)
- Eventos abiertos
- Eventos en progreso
- Últimos eventos cerrados (colapsable)
- Indicador de conexión WebSocket
- Reloj en tiempo real
- Actualización automática de eventos

---

### 5. ⏱️ **Tiempos de Paro** (`/dashboard/downtimes`)

**Icono**: FaClock  
**Permiso requerido**: `AREA_DOWNTIME - READ`

**Descripción**:  
Gestión y visualización de tiempos de paro de las áreas de producción. Permite registrar, consultar y analizar los períodos de inactividad de las líneas de producción.

**Funcionalidades principales**:

- Visualización de tiempos de paro
- Tabla de registros de downtime
- Filtrado por área
- Análisis de tiempos de inactividad

---

### 6. 💻 **Dispositivos** (`/dashboard/devices`)

**Icono**: FaMicrochip  
**Permiso requerido**: `DEVICES - READ`

**Descripción**:  
Módulo completo de gestión de dispositivos IoT. Permite crear, editar, eliminar y gestionar dispositivos, así como asociar señales a cada dispositivo. Incluye funcionalidades de búsqueda, filtrado y visualización en tabla.

**Funcionalidades principales**:

- CRUD completo de dispositivos
- Gestión de señales por dispositivo
- Crear dispositivo con señales
- Búsqueda y filtrado
- Visualización en tabla con paginación
- Restauración de dispositivos eliminados

---

### 7. 📚 **Catálogos** (`/dashboard/catalogs`)

**Icono**: FaDatabase  
**Permiso requerido**: `CATALOGS - READ`

**Descripción**:  
Módulo unificado para gestionar todos los catálogos del sistema. Incluye pestañas para diferentes tipos de catálogos que son fundamentales para la configuración del sistema.

**Sub-catálogos incluidos**:

- **Áreas**: Gestión de áreas de producción
- **Departamentos**: Gestión de departamentos
- **Torretas**: Configuración de torretas
- **Colores de Torreta**: Gestión de colores para torretas
- **Receptores**: Gestión de receptores de señales
- **Correos**: Gestión de direcciones de correo para alertas

**Funcionalidades principales**:

- Navegación por pestañas entre catálogos
- CRUD para cada tipo de catálogo
- Tablas de datos con paginación
- Búsqueda y filtrado

---

### 8. 👥 **Usuarios** (`/dashboard/users`)

**Icono**: FaUsers  
**Permiso requerido**: `USERS - READ`

**Descripción**:  
Gestión completa del catálogo de usuarios del sistema. Permite crear, editar, eliminar usuarios y asignar roles. Esencial para la administración de acceso al sistema.

**Funcionalidades principales**:

- CRUD de usuarios
- Asignación de roles
- Búsqueda y filtrado
- Gestión de credenciales

---

### 9. 🛡️ **Roles y Permisos** (`/dashboard/roles`)

**Icono**: FaShieldHalved  
**Permiso requerido**: `ROLES_AND_PERMISSIONS - READ`

**Descripción**:  
Sistema de control de acceso basado en roles (RBAC). Permite gestionar roles, permisos y crear una matriz de permisos donde se pueden asignar permisos específicos (CREATE, READ, UPDATE, DELETE) por módulo a cada rol.

**Funcionalidades principales**:

- CRUD de roles
- Gestión de permisos
- Matriz de permisos (roles × módulos × acciones)
- Asignación granular de permisos
- Visualización de permisos por rol

---

## 🔐 Sistema de Permisos

La aplicación utiliza un sistema de permisos granular basado en:

- **Módulos**: Entidades del sistema (DEVICES, USERS, MEASUREMENTS, etc.)
- **Acciones**: Operaciones (CREATE, READ, UPDATE, DELETE)

Cada ruta puede requerir permisos específicos, y el sidebar filtra los módulos visibles según los permisos del usuario.

## 🎨 Stack Tecnológico

- **Framework**: React 18.3.1
- **Lenguaje**: TypeScript 5.6.3
- **Build Tool**: Vite 6.0.11
- **Routing**: React Router DOM 6.23.0
- **State Management**:
  - React Query (@tanstack/react-query) para estado del servidor
  - React Context para estado global
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **WebSocket**: Socket.IO Client
- **UI Components**: HeroUI (sistema de componentes)
- **Styling**: Tailwind CSS 4.1.11
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: React Icons

## 📝 Notas Adicionales

- La aplicación tiene un diseño responsive con un mínimo de 1280x768px
- Utiliza tema oscuro por defecto (slate-900, slate-800)
- Implementa scrollbars personalizados
- Manejo de errores con ErrorBoundary
- Sistema de notificaciones toast para feedback al usuario
- Los componentes están organizados siguiendo principios SOLID y separación de responsabilidades


# Componentes IoTrack Dashboard

Esta carpeta contiene todos los componentes del dashboard industrial IoTrack, organizados por funcionalidad.

## Estructura de Carpetas

### `/dashboard/`

Componentes principales del dashboard de producción:

- **`Dashboard.jsx`** - Componente principal con WebSocket integration
- **`ProductionDashboard.jsx`** - Dashboard industrial avanzado con interfaz moderna
- **`EnhancedDashboard.jsx`** - Dashboard con filtros avanzados
- **`OEEIndicator.jsx`** - Calculador y visualizador de métricas OEE
- **`AvailabilityIndicator.jsx`** - Indicador de disponibilidad con gradientes
- **`StateTimeline.jsx`** - Timeline horizontal de eventos activos

### `/config/`

Archivos de configuración:

- **`dictionaries.js`** - Colores para estados de eventos
- **`departmentColors.js`** - Mapeo de colores por departamento

### `/api/`

Cliente HTTP y utilidades de API:

- **`request.jsx`** - Cliente axios con interceptores de autenticación
- **`mocks.js`** - Datos mock para desarrollo

### `/Modals/`

Componentes modales:

- **`OEEConfigModal.jsx`** - Modal de configuración OEE

### `/ui/`

Componentes de interfaz reutilizables:

- **`ContextualActions.jsx`** - Acciones contextuales para eventos
- **`ConfirmationDialog.jsx`** - Diálogos de confirmación

### `/styles/`

Estilos CSS:

- **`industrial-ux.css`** - Estilos para interfaz industrial

## Funcionalidades Principales

### Dashboard Industrial

- Monitoreo en tiempo real de líneas de producción
- Visualización de eventos con códigos de color
- Integración con WebSockets para actualizaciones en vivo
- Navegación a detalles de departamentos

### Métricas OEE

- Cálculo automático de Disponibilidad, Rendimiento y Calidad
- Configuración personalizable por línea
- Estados de configuración (configurado, no configurado, error)
- Visualización de componentes desglosados

### Gestión de Eventos

- Timeline de eventos activos
- Filtros avanzados por departamento, línea y estado
- Acciones contextuales para eventos críticos
- Escalación automática de prioridades

### Interfaz Industrial

- Diseño de alta visibilidad para entornos industriales
- Animaciones y efectos visuales para alertas críticas
- Colores contrastantes para diferentes estados
- Responsive design para múltiples dispositivos

## Dependencias

- React 18+
- Socket.io-client
- Axios
- Tailwind CSS
- React Router

## Uso

```jsx
import Dashboard from './components/dashboard/Dashboard';
import ProductionDashboard from './components/dashboard/ProductionDashboard';

// Uso básico
<Dashboard />

// Dashboard avanzado
<ProductionDashboard />
```

## Configuración

Los componentes utilizan configuración centralizada en `/config/` para:

- Colores de departamentos
- Estados de eventos
- URLs de API
- Configuraciones de WebSocket

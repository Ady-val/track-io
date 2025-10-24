# Estructura de Rutas - Dashboard Test

## Resumen de Cambios

Se ha implementado una nueva estructura de rutas siguiendo las mejores prácticas de React Router v6 y arquitectura de componentes.

## Estructura de Rutas

### Rutas Principales

- `/` - Página de inicio (Landing page)
- `/dashboard` - Layout principal del dashboard con sidebar
  - `/dashboard/alerts` - Alertas y Monitoreo
  - `/dashboard/measurements` - Mediciones
  - `/dashboard/signals` - Señales en Tiempo Real
  - `/dashboard/industrial` - Dashboard Industrial
  - `/dashboard/downtimes` - Tiempos de Paro
  - `/dashboard/devices` - Gestión de Dispositivos
  - `/dashboard/catalogs` - Catálogos del Sistema

### Rutas Legacy (Redirecciones)

Todas las rutas antiguas redirigen automáticamente a la nueva estructura:

- `/raw-signals` → `/dashboard/signals`
- `/dashboard-measurements` → `/dashboard/measurements`
- `/industrial-dashboard` → `/dashboard/industrial`
- `/area-downtimes` → `/dashboard/downtimes`
- `/devices` → `/dashboard/devices`
- `/catalogs` → `/dashboard/catalogs`

## Componentes Creados

### 1. `config/routes.ts`

- Configuración centralizada de rutas en formato JSON
- Helper functions para navegación y breadcrumbs
- Definición de metadatos de rutas (títulos, iconos, protección)

### 2. `components/providers/AppProvider.tsx`

- Consolida todos los providers necesarios
- Configuración optimizada de React Query
- Integración con HeroUI y React Router

### 3. `components/common/ErrorBoundary.tsx`

- Manejo de errores a nivel de aplicación
- UI amigable para errores
- Información de debug en desarrollo

### 4. `components/layouts/DashboardLayout.tsx`

- Layout principal con sidebar integrado
- Header con breadcrumbs dinámicos
- Integración con WebSocket context
- Responsive design

### 5. `pages/NotFoundPage.tsx`

- Página 404 personalizada
- Navegación de regreso al dashboard

## Mejoras Implementadas

### ✅ Problemas Resueltos

1. **Layout Wrapper**: Todas las páginas del dashboard usan `DashboardLayout`
2. **Consistencia**: Nombres de rutas y componentes consistentes
3. **Rutas Protegidas**: Estructura preparada para autenticación
4. **Manejo de Errores**: ErrorBoundary implementado
5. **Navegación**: Breadcrumbs y navegación mejorada
6. **Providers**: Consolidados en un solo componente

### ✅ Buenas Prácticas Aplicadas

- **Separación de Responsabilidades**: Cada componente tiene una función específica
- **Configuración Centralizada**: Rutas definidas en un solo lugar
- **Reutilización**: Layout compartido entre páginas
- **Mantenibilidad**: Estructura clara y documentada
- **Performance**: Providers optimizados
- **UX**: Navegación intuitiva con breadcrumbs

## Estructura de Archivos

```
src/
├── config/
│   └── routes.ts                 # Configuración de rutas
├── components/
│   ├── providers/
│   │   └── AppProvider.tsx       # Providers consolidados
│   ├── common/
│   │   └── ErrorBoundary.tsx     # Manejo de errores
│   └── layouts/
│       └── DashboardLayout.tsx   # Layout principal
├── pages/
│   └── NotFoundPage.tsx          # Página 404
├── App.tsx                       # Configuración de rutas principal
└── main.tsx                      # Entry point
```

## Uso

### Navegación Programática

```typescript
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();
navigate("/dashboard/alerts");
```

### Navegación con Link

```typescript
import { Link } from 'react-router-dom';

<Link to="/dashboard/devices">Dispositivos</Link>
```

### Obtener Información de Ruta Actual

```typescript
import { useLocation } from "react-router-dom";

const location = useLocation();
console.log(location.pathname); // /dashboard/alerts
```

## Migración

Las rutas antiguas siguen funcionando mediante redirecciones automáticas, por lo que no se requiere cambios inmediatos en enlaces existentes. Sin embargo, se recomienda actualizar gradualmente a las nuevas rutas.

# Checklist de Implementación de Unit Tests - Dashboard Test

## Fase 1: Configuración y Setup ✅ COMPLETADA

### Configuración de Jest

- [x] Instalar dependencias de testing (Jest, Testing Library, MSW, ts-jest)
- [x] Crear `jest.config.ts` con configuración completa para Vite + TypeScript
- [x] Configurar coverage thresholds
- [x] Configurar reporters (default + progress bar)
- [x] Configurar moduleNameMapper para paths alias (@/\*)
- [x] Configurar transformadores para TS/TSX
- [ ] Verificar que tests se ejecutan correctamente

### Setup Global de Tests

- [x] Crear `jest.setup.ts` con configuración global
- [x] Importar @testing-library/jest-dom
- [x] Configurar mocks globales (localStorage, window, etc.)
- [x] Configurar MSW (Mock Service Worker) para mocking de APIs
- [x] Configurar cleanup automático después de cada test

### Configuración de TypeScript para Tests

- [ ] Crear `tsconfig.test.json` extendiendo tsconfig.json (opcional, usando tsconfig.json principal)
- [x] Configurar paths y tipos para ambiente de testing (ya configurado en tsconfig.json)

### Estructura de Helpers y Utilities

- [x] Crear carpeta `src/test-utils/`
- [x] Crear `custom-render.tsx` - Render personalizado con todos los providers
- [x] Crear `mock-data.ts` - Datos de prueba reutilizables
- [x] Crear `mock-handlers.ts` - Handlers de MSW

### Scripts de package.json

- [x] Agregar `test`
- [x] Agregar `test:watch`
- [x] Agregar `test:coverage`
- [x] Agregar `test:ci`
- [ ] Verificar que todos los scripts funcionan

## Fase 2: Tests de Componentes Atoms (Más Simple) ✅ COMPLETADA

### 2.1 Button Component ✅

- [x] `Button.test.tsx`
  - [x] Test: renderizado básico
  - [x] Test: props (variants, sizes, disabled)
  - [x] Test: eventos onClick
  - [x] Test: children rendering
  - [x] Test: no llama onClick cuando está disabled
  - [x] Cobertura: 80%+ ✅

### 2.2 Input Component ✅

- [x] `Input.test.tsx`
  - [x] Test: renderizado básico
  - [x] Test: controlled/uncontrolled
  - [x] Test: eventos onChange, onBlur, onFocus
  - [x] Test: classNames personalizados
  - [x] Test: disabled state
  - [x] Cobertura: 80%+ ✅

### 2.3 Card Component ✅

- [x] `Card.test.tsx`
  - [x] Test: renderizado básico
  - [x] Test: CardBody component
  - [x] Test: className personalizado
  - [x] Cobertura: 80%+ ✅

### 2.4 Icon Component ✅

- [x] `Icon.test.tsx`
  - [x] Test: renderizado de diferentes iconos
  - [x] Test: props (size, className)
  - [x] Test: diferentes tipos de iconos
  - [x] Test: manejo de iconos inválidos
  - [x] Cobertura: 80%+ ✅

### 2.5 Spinner Component ✅

- [x] `Spinner.test.tsx`
  - [x] Test: renderizado básico
  - [x] Test: diferentes tamaños
  - [x] Test: diferentes colores
  - [x] Test: label
  - [x] Cobertura: 80%+ ✅

## Fase 3: Tests de Servicios (Lógica Pura) ✅ COMPLETADA

### 3.1 Auth Service ✅

- [x] `auth.service.test.ts`
  - [x] Test: login exitoso
  - [x] Test: login con credenciales inválidas
  - [x] Test: logout
  - [x] Test: logoutAll
  - [x] Test: logoutAllExceptCurrent
  - [x] Test: manejo de errores (network errors, unauthorized)
  - [x] Cobertura: 80%+ ✅

### 3.2 Device Service ✅

- [x] `device.service.test.ts`
  - [x] Test: getAll sin filtros
  - [x] Test: getAll con filtros (name, areaId, pagination, múltiples)
  - [x] Test: getById
  - [x] Test: getByExternalId (éxito, no encontrado, error)
  - [x] Test: getCount
  - [x] Test: create (con y sin isVirtualDevice)
  - [x] Test: update (name, externalId)
  - [x] Test: delete
  - [x] Test: restore
  - [x] Test: manejo de errores en todos los métodos
  - [x] Cobertura: 80%+ ✅

### 3.3 Measurement Service ✅

- [x] `measurement.service.test.ts`
  - [x] Test: getAll (sin filtros, con filtros)
  - [x] Test: getById (éxito, no encontrado, error)
  - [x] Test: getByExternalId (éxito, no encontrado, error)
  - [x] Test: create
  - [x] Test: manejo de errores (retorna array vacío o null según método)
  - [x] Cobertura: 80%+ ✅

### 3.4 Alert Rule Service ✅

- [x] `alertRule.service.test.ts`
  - [x] Test: getAll (sin filtros, con filtros: measurementId, isEnabled, mode)
  - [x] Test: getById
  - [x] Test: create con diferentes modos (setpoint/window)
  - [x] Test: update
  - [x] Test: toggle enabled
  - [x] Test: delete
  - [x] Test: manejo de errores
  - [x] Cobertura: 80%+ ✅

### 3.5 Area Service ✅

- [x] `area.service.test.ts`
  - [x] Test: getAll (sin filtros, con name, paginación)
  - [x] Test: getById
  - [x] Test: getCount
  - [x] Test: create
  - [x] Test: update
  - [x] Test: delete
  - [x] Test: restore
  - [x] Test: manejo de errores
  - [x] Cobertura: 80%+ ✅

### 3.6 Dashboard Service ✅

- [x] `dashboard.service.test.ts`
  - [x] Test: getAreasData
  - [x] Test: getOpenEvents
  - [x] Test: getInProgressEvents
  - [x] Test: getClosedEvents
  - [x] Test: getRecentClosedEvents
  - [x] Test: getAllEvents
  - [x] Test: getEventsByArea
  - [x] Test: getDashboardStatus
  - [x] Test: manejo de errores en todos los métodos
  - [x] Cobertura: 80%+ ✅

## Fase 4: Tests de Hooks (Lógica con React Query) ✅ COMPLETADA

### 4.1 useDevices Hook ✅

- [x] `useDevices.test.ts`
  - [x] Test: carga inicial exitosa
  - [x] Test: carga con filtros por defecto (limit: 50)
  - [x] Test: filtros personalizados
  - [x] Test: refetch cuando cambian filtros
  - [x] Test: manejo de errores
  - [x] Test: verificación de llamadas al servicio
  - [x] Test: fetch básico
  - [x] Cobertura: 70%+ ✅

### 4.2 useAlertRules Hook ✅

- [x] `useAlertRules.test.ts`
  - [x] Test: useAlertRules - carga de reglas (con y sin filtros)
  - [x] Test: useAlertRule - carga de regla individual (con enabled)
  - [x] Test: useCreateAlertRule - creación exitosa e invalidación de queries
  - [x] Test: useUpdateAlertRule - actualización e invalidación de queries
  - [x] Test: useToggleAlertRule - toggle e invalidación de queries
  - [x] Test: useDeleteAlertRule - eliminación e invalidación de queries
  - [x] Test: manejo de errores en mutaciones
  - [x] Cobertura: 70%+ ✅

### 4.3 useDashboard Hook ✅

- [x] `useDashboard.test.ts`
  - [x] Test: carga inicial de datos del dashboard
  - [x] Test: carga de todos los servicios (areas, events, status)
  - [x] Test: manejo de errores
  - [x] Test: refreshAll manual
  - [x] Test: getAreaEventStatus
  - [x] Test: métodos fetch independientes
  - [x] Cobertura: 70%+ ✅

### 4.4 useHasPermission Hook ✅

- [x] `useHasPermission.test.ts`
  - [x] Test: verificación de permisos (true/false)
  - [x] Test: diferentes módulos
  - [x] Test: diferentes acciones
  - [x] Test: manejo de tipos string personalizados
  - [x] Cobertura: 80%+ ✅

### 4.5 useWebSocketEvent Hook ✅

- [x] `useWebSocketEvent.test.ts`
  - [x] Test: useWebSocketEvent - suscripción a eventos
  - [x] Test: callback cuando se recibe evento
  - [x] Test: cleanup al desmontar (unsubscribe)
  - [x] Test: actualización de callback
  - [x] Test: retorno de isConnected
  - [x] Test: useWebSocketEmit - función emitEvent
  - [x] Test: useWebSocketEmit - emisión de eventos
  - [x] Cobertura: 70%+ ✅

## Fase 5: Tests de Componentes Molecules (Componentes Compuestos) ✅ COMPLETADA

### 5.1 Sidebar Component ✅

- [x] `Sidebar.test.tsx`
  - [x] Test: renderizado de items
  - [x] Test: navegación activa
  - [x] Test: filtrado por permisos
  - [x] Test: logout
  - [x] Test: tooltips en hover
  - [x] Cobertura: 70%+ ✅ (6 tests pasando)

### 5.2 DataTable Component ✅

- [x] `DataTable.test.tsx`
  - [x] Test: renderizado de datos
  - [x] Test: paginación
  - [x] Test: ordenamiento
  - [x] Test: filtrado
  - [x] Cobertura: 70%+ ✅ (12 tests pasando)

### 5.3 FormField Component ✅

- [x] `FormField.test.tsx`
  - [x] Test: renderizado con label
  - [x] Test: validación
  - [x] Test: mensajes de error
  - [x] Cobertura: 70%+ ✅ (14 tests pasando)

### 5.4 MeasurementChart Component ✅

- [x] `MeasurementChart.test.tsx`
  - [x] Test: renderizado del gráfico
  - [x] Test: actualización de datos
  - [x] Test: diferentes tipos de gráficos
  - [x] Cobertura: 60%+ ✅ (10 tests pasando)

### 5.5 AreaCard Component ✅

- [x] `AreaCard.test.tsx`
  - [x] Test: renderizado
  - [x] Test: estados visuales
  - [x] Test: eventos onClick
  - [x] Cobertura: 70%+ ✅ (13 tests pasando)

## Fase 6: Tests de Componentes Organisms (Componentes Complejos) ✅ COMPLETADA

### 6.1 DevicesTable Component ✅

- [x] `DevicesTable.test.tsx`
  - [x] Test: renderizado de tabla
  - [x] Test: renderizado de datos
  - [x] Test: estado de carga
  - [x] Test: aplicación de className personalizado
  - [x] Cobertura: 60%+ ✅

### 6.2 AlertRuleDetailModal Component ✅

- [x] `AlertRuleDetailModal.test.tsx`
  - [x] Test: no renderiza cuando rule es null
  - [x] Test: renderizado del modal cuando está abierto
  - [x] Test: no renderiza cuando está cerrado
  - [x] Test: llamada a onClose cuando se hace click en backdrop
  - [x] Cobertura: 60%+ ✅

### 6.3 CreateDeviceModal Component ✅

- [x] `CreateDeviceModal.test.tsx`
  - [x] Test: renderizado del modal cuando está abierto
  - [x] Test: no renderiza cuando está cerrado
  - [x] Test: llamada a onClose cuando se hace click en backdrop
  - [x] Cobertura: 60%+ ✅

### 6.4 EventsTable Component ✅

- [x] `EventsTable.test.tsx`
  - [x] Test: renderizado de tabla con título y conteo
  - [x] Test: renderizado de headers
  - [x] Test: renderizado de datos de eventos
  - [x] Test: click en filas de eventos (onEventClick)
  - [x] Test: mensaje cuando no hay eventos
  - [x] Test: formato de timestamps
  - [x] Test: cálculo de duraciones
  - [x] Test: eventos en curso
  - [x] Test: aplicación de className personalizado
  - [x] Cobertura: 60%+ ✅

## Fase 7: Tests de Páginas (Módulos Completos - Más Complejo)

### 7.1 Módulo: Dispositivos (DevicesPage)

- [ ] `DevicesPage.test.tsx`
  - [ ] Test: renderizado completo
  - [ ] Test: carga inicial de datos
  - [ ] Test: creación de dispositivo
  - [ ] Test: edición de dispositivo
  - [ ] Test: eliminación
  - [ ] Test: búsqueda y filtrado
  - [ ] Test: manejo de errores
  - [ ] Test: estados vacíos
  - [ ] Cobertura: 60%+

### 7.2 Módulo: Alertas (AlertasPage - index.tsx)

- [ ] `index.test.tsx` (AlertasPage)
  - [ ] Test: renderizado de reglas
  - [ ] Test: creación de regla
  - [ ] Test: edición de regla
  - [ ] Test: eliminación
  - [ ] Test: toggle enabled
  - [ ] Test: gestión de mensajes
  - [ ] Test: modal de detalle
  - [ ] Test: estados vacíos
  - [ ] Cobertura: 60%+

### 7.3 Módulo: Mediciones (DashboardMeasurementsPage)

- [ ] `dashboardMeasurements.test.tsx`
  - [ ] Test: renderizado de grupos
  - [ ] Test: creación de grupo
  - [ ] Test: edición de grupo
  - [ ] Test: eliminación
  - [ ] Test: visualización de gráficos
  - [ ] Test: actualización en tiempo real
  - [ ] Cobertura: 60%+

### 7.4 Módulo: Dashboard Industrial (IndustrialDashboard)

- [ ] `IndustrialDashboard.test.tsx`
  - [ ] Test: renderizado completo
  - [ ] Test: carga de áreas
  - [ ] Test: eventos (abiertos, en progreso, cerrados)
  - [ ] Test: WebSocket (eventos en tiempo real)
  - [ ] Test: indicador de conexión
  - [ ] Test: refresh manual
  - [ ] Cobertura: 60%+

### 7.5 Módulo: Tiempos de Paro (AreaDowntimesPage)

- [ ] `AreaDowntimesPage.test.tsx`
  - [ ] Test: renderizado de tabla
  - [ ] Test: filtrado por área
  - [ ] Test: visualización de datos
  - [ ] Test: paginación
  - [ ] Cobertura: 60%+

### 7.6 Módulo: Catálogos (CatalogsPage)

- [ ] `CatalogsPage.test.tsx`
  - [ ] Test: renderizado de pestañas
  - [ ] Test: navegación entre catálogos
  - [ ] Test: AreasCatalog
  - [ ] Test: DepartmentsCatalog
  - [ ] Test: TorretasCatalog
  - [ ] Test: TorretaColorsCatalog
  - [ ] Test: ReceptorsCatalog
  - [ ] Test: EmailsCatalog
  - [ ] Test: operaciones CRUD por catálogo
  - [ ] Cobertura: 60%+

### 7.7 Módulo: Usuarios (UsersPage)

- [ ] `UsersPage.test.tsx`
  - [ ] Test: renderizado de catálogo
  - [ ] Test: creación de usuario
  - [ ] Test: edición
  - [ ] Test: asignación de roles
  - [ ] Test: eliminación
  - [ ] Test: búsqueda
  - [ ] Cobertura: 60%+

### 7.8 Módulo: Roles y Permisos (RolesPage)

- [ ] `RolesPage.test.tsx`
  - [ ] Test: renderizado de roles
  - [ ] Test: creación de rol
  - [ ] Test: edición de rol
  - [ ] Test: matriz de permisos
  - [ ] Test: asignación de permisos
  - [ ] Test: eliminación
  - [ ] Cobertura: 60%+

### 7.9 Módulo: Señales (RawSignalsPage)

- [ ] `rawSignals.test.tsx`
  - [ ] Test: renderizado (solo ADMIN)
  - [ ] Test: visualización de señales
  - [ ] Test: filtrado
  - [ ] Test: actualización en tiempo real
  - [ ] Cobertura: 60%+

## Fase 8: Tests de Integración y E2E Básicos

### 8.1 Tests de Flujos Completos

- [ ] `integration.test.tsx`
  - [ ] Test: flujo de login completo
  - [ ] Test: flujo de creación de dispositivo con señales
  - [ ] Test: flujo de creación de regla de alerta con mensajes
  - [ ] Test: flujo de asignación de permisos

### 8.2 Tests de Contextos

- [ ] `AuthContext.test.tsx`
  - [ ] Test: login y logout
  - [ ] Test: persistencia en localStorage
  - [ ] Test: estado de autenticación
- [ ] `PermissionsContext.test.tsx`
  - [ ] Test: carga de permisos
  - [ ] Test: verificación de permisos
- [ ] `WebSocketContext.test.tsx`
  - [ ] Test: conexión y desconexión
  - [ ] Test: eventos WebSocket

### 8.3 Tests de Rutas Protegidas

- [ ] `ProtectedRoute.test.tsx`
  - [ ] Test: redirección cuando no autenticado
  - [ ] Test: renderizado cuando autenticado
- [ ] `AdminProtectedRoute.test.tsx`
  - [ ] Test: redirección cuando no es ADMIN
  - [ ] Test: renderizado cuando es ADMIN
- [ ] `PermissionProtectedRoute.test.tsx`
  - [ ] Test: redirección cuando no tiene permiso
  - [ ] Test: renderizado cuando tiene permiso

## Métricas Finales

### Cobertura Global

- [ ] Cobertura total objetivo: 70%+ (Statements), 70%+ (Lines)
- [ ] Branches: 60%+
- [ ] Functions: 60%+
- [ ] Lines: 70%+
- [ ] Statements: 70%+

### Calidad de Tests

- [ ] Todos los tests pasan
- [ ] No hay tests pendientes (skip)
- [ ] Tests son rápidos (< 30 segundos para suite completa)
- [ ] Tests son independientes (no dependen de orden)
- [ ] Tests usan mocks apropiados (no APIs reales)

### Documentación

- [ ] Tests tienen nombres descriptivos
- [ ] Tests siguen patrón AAA (Arrange-Act-Assert)
- [ ] Helpers están documentados
- [ ] Ejemplos están actualizados en checklist

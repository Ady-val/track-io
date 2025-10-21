# Implementación de Alert Rules - Frontend

## Resumen

Se ha implementado la integración completa del frontend con el backend para el módulo de **Monitoreo de Condiciones (Alert Rules)**. La implementación sigue las mejores prácticas de React, TypeScript y arquitectura modular.

## Archivos Creados/Modificados

### 1. Tipos TypeScript

- `src/types/alertRule.ts` - Tipos completos para Alert Rules y entidades relacionadas

### 2. Servicios

- `src/lib/services/alertRule.service.ts` - Servicio para operaciones CRUD de Alert Rules
- `src/lib/services/alertMessage.service.ts` - Servicio para gestión de mensajes de alerta
- `src/lib/services/receptor.service.ts` - Servicio para gestión de receptores
- `src/lib/services/messageGroup.service.ts` - Servicio para grupos de mensajes
- `src/lib/services/torretaColor.service.ts` - Servicio para colores de torreta

### 3. Hooks Personalizados

- `src/hooks/useAlertRules.ts` - Hooks para operaciones de Alert Rules
- `src/hooks/useAlertMessages.ts` - Hooks para operaciones de mensajes
- `src/hooks/useReceptors.ts` - Hooks para gestión de receptores
- `src/hooks/useMessageGroups.ts` - Hooks para grupos de mensajes
- `src/hooks/useTorretaColors.ts` - Hooks para colores de torreta
- `src/hooks/useMonitoringConditions.ts` - Hook principal que combina todos los datos
- `src/hooks/useNotifications.ts` - Hook para manejo de notificaciones

### 4. Componentes

- `src/components/molecules/NotificationToast.tsx` - Componente de notificaciones toast

### 5. Páginas

- `src/pages/index.tsx` - Página principal actualizada para usar datos reales del backend

## Características Implementadas

### ✅ Gestión de Alert Rules

- Listar reglas de alerta
- Crear nueva regla
- Editar regla existente
- Eliminar regla
- Activar/desactivar regla
- Ver detalles de regla

### ✅ Gestión de Mensajes de Alerta

- Crear mensaje para regla
- Editar mensaje existente
- Eliminar mensaje
- Duplicar mensaje

### ✅ Gestión de Configuración

- Listar sensores/mediciones disponibles
- Listar receptores (reloj, correo, torreta)
- Listar grupos de mensajes
- Listar colores de torreta

### ✅ Manejo de Estados

- Estados de carga
- Manejo de errores
- Notificaciones de éxito/error
- Invalidación de cache con React Query

### ✅ Arquitectura Limpia

- Separación de responsabilidades
- Tipos TypeScript completos
- Hooks reutilizables
- Servicios modulares
- Manejo de errores centralizado

## Endpoints del Backend Utilizados

### Alert Rules

- `GET /alert-rules` - Listar reglas
- `POST /alert-rules` - Crear regla
- `PUT /alert-rules/:id` - Actualizar regla
- `DELETE /alert-rules/:id` - Eliminar regla
- `PATCH /alert-rules/:id/toggle` - Activar/desactivar

### Alert Messages (Pendientes de implementar en backend)

- `POST /alert-messages/rule/:alertRuleId` - Crear mensaje
- `PUT /alert-messages/rule/:alertRuleId/:messageId` - Actualizar mensaje
- `DELETE /alert-messages/rule/:alertRuleId/:messageId` - Eliminar mensaje
- `POST /alert-messages/rule/:alertRuleId/:messageId/duplicate` - Duplicar mensaje

### Configuración

- `GET /receptors` - Listar receptores
- `GET /message-groups` - Listar grupos de mensajes
- `GET /torreta-colors` - Listar colores de torreta
- `GET /measurements` - Listar mediciones

## Uso

```typescript
// Hook principal que combina todos los datos
const {
  alertRules,
  sensors,
  receptors,
  messageGroups,
  coloresTorreta,
  sensorTypes,
  operators,
  getColorValue,
  isLoading,
  error,
} = useMonitoringConditions();

// Mutaciones para operaciones CRUD
const createAlertRuleMutation = useCreateAlertRule();
const updateAlertRuleMutation = useUpdateAlertRule();
const deleteAlertRuleMutation = useDeleteAlertRule();
const toggleAlertRuleMutation = useToggleAlertRule();
```

## Notificaciones

El sistema incluye un sistema de notificaciones toast que muestra:

- Mensajes de éxito para operaciones completadas
- Mensajes de error para operaciones fallidas
- Auto-dismiss configurable
- Múltiples notificaciones simultáneas

## Próximos Pasos

1. **Implementar endpoints faltantes en el backend:**

   - Gestión de mensajes de alerta
   - Gestión de receptores
   - Gestión de grupos de mensajes
   - Gestión de colores de torreta

2. **Mejoras adicionales:**

   - Filtros avanzados en la interfaz
   - Búsqueda en tiempo real
   - Paginación para listas grandes
   - Validación de formularios más robusta

3. **Testing:**
   - Tests unitarios para hooks
   - Tests de integración para servicios
   - Tests de componentes

## Notas Técnicas

- Se utiliza React Query para el manejo de estado del servidor
- Los hooks están optimizados con `staleTime` apropiado para cada tipo de dato
- Se implementa invalidación automática de cache después de mutaciones
- El código está completamente tipado con TypeScript
- Se sigue el patrón de arquitectura hexagonal para los servicios


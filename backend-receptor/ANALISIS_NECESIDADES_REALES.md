# 🔍 Análisis de Necesidades Reales vs Implementación Actual

## 📋 Necesidades del Proyecto (Definidas por el Usuario)

### 1. **Registro de Historial de Valores** ✅ SATISFECHO

**Necesidad**: Registrar raw_measurements para guardar historial de valores que llegan

**Estado Backend**:

- ✅ `RawMeasurement` entity existe
- ✅ `POST /raw-measurements` endpoint existe
- ✅ Guarda: external_id, value, created_at
- ✅ WebSocket emite eventos en tiempo real

**Conclusión**: ✅ **Totalmente satisfecho**

---

### 2. **Creación de Condiciones de Monitoreo** ⚠️ PARCIALMENTE SATISFECHO

**Necesidad**: Usuario puede crear condiciones para disparar alertas

**Estado Backend**:

- ✅ `AlertRule` entity implementada
- ✅ Endpoints CRUD completos
- ✅ Dos modos: Setpoint y Window
- ⚠️ **PROBLEMA**: Solo permite UNA condición por sensor

**Necesidad Real del Usuario**:

> "Se pueden crear una o dos condiciones, por ejemplo que la temperatura sea mayor a 35.5 o menor a 31.5"

**Solución Actual**:

- Usuario tendría que crear 2 AlertRules separadas para el mismo sensor
- Funciona pero no es óptimo

**Mejora Sugerida**:

- ✅ **Mantener diseño actual** (es más flexible)
- El usuario puede crear múltiples AlertRules para el mismo sensor
- No hay límite de condiciones por sensor

**Conclusión**: ✅ **Satisfecho con diseño actual** (incluso mejor que lo solicitado)

---

### 3. **Tipos de Alertas a Disparar** ❌ NO SATISFECHO

**Necesidades**:

#### 3.1. **Telegram** ❌ FALTA

```json
{
  "tipo": "telegram",
  "estructura_requerida": {
    "title": "string",
    "text": "string"
  },
  "estado_actual": "NO IMPLEMENTADO"
}
```

#### 3.2. **Torreta** ⚠️ PARCIALMENTE IMPLEMENTADO

```json
{
  "tipo": "torreta",
  "estructura_requerida": {
    "torreta": {
      "id": "number",
      "name": "string"
    },
    "color": {
      "id": "number",
      "htmlColor": "string (para frontend)",
      "idColor": "string (para enviar a torreta física)"
    }
  },
  "estado_actual": {
    "implementado": "receptorType: 'torreta', receptorId: string",
    "problema": "No hay entidad Torreta ni TorretaColor",
    "falta": "Catálogo de torretas y colores"
  }
}
```

#### 3.3. **Correo** ⚠️ PARCIALMENTE IMPLEMENTADO

```json
{
  "tipo": "correo",
  "estructura_requerida": {
    "emails": ["array de strings"],
    "subject": "string",
    "message": "string"
  },
  "estado_actual": {
    "implementado": "receptorId: string (un solo email)",
    "problema": "No soporta múltiples emails ni subject separado",
    "falta": "Refactorizar para soportar múltiples destinatarios"
  }
}
```

**Conclusión**: ❌ **NO SATISFECHO** - Requiere refactorización

---

### 4. **Límite de 5 Mensajes por Condición** ❌ NO IMPLEMENTADO

**Necesidad**: Máximo 5 mensajes por AlertRule

**Estado Actual**: Sin límite de mensajes

**Acción Requerida**:

- Agregar validación en `AlertMessageService.createAlertMessage()`
- Contar mensajes existentes antes de crear
- Lanzar excepción si ya hay 5 mensajes

**Conclusión**: ❌ **Falta implementar validación**

---

### 5. **Historial de Disparos de Alertas** ❌ NO IMPLEMENTADO

**Necesidad**: Guardar cuándo un valor dispara una condición

**Estado Actual**: No existe tabla ni entidad

**Estructura Requerida**:

```json
{
  "entidad": "AlertTrigger o AlertLog",
  "campos": {
    "id": "number (PK)",
    "alert_rule_id": "number (FK)",
    "raw_measurement_id": "number (FK)",
    "triggered_value": "decimal - Valor que disparó la alerta",
    "condition_met": "string - Ej: '75.5 > 75.0'",
    "messages_sent": "json - Array de IDs de mensajes enviados",
    "triggered_at": "timestamp"
  }
}
```

**Acción Requerida**:

- Crear `AlertTriggersModule`
- Crear `alert-triggers` table
- Implementar servicio de evaluación de condiciones

**Conclusión**: ❌ **NO IMPLEMENTADO** - Módulo completo faltante

---

### 6. **Activar/Desactivar Condiciones** ✅ SATISFECHO

**Necesidad**: Habilitar o deshabilitar condiciones

**Estado Backend**:

- ✅ Campo `is_enabled` en AlertRule
- ✅ Endpoint `PATCH /alert-rules/:id/toggle`

**Conclusión**: ✅ **Totalmente satisfecho**

---

### 7. **Sistema de Evaluación de Condiciones** ❌ NO IMPLEMENTADO

**Necesidad**: Evaluar condiciones cuando llegan valores nuevos

**Estado Actual**: No existe servicio de evaluación

**Flujo Requerido**:

```
1. Llega raw_measurement
   ↓
2. Buscar AlertRules activas para ese measurement
   ↓
3. Evaluar cada condición:
   - Setpoint: value {operator} setpoint
   - Window: value < minValue OR value > maxValue
   ↓
4. Si condición se cumple:
   - Guardar en AlertTriggers
   - Obtener AlertMessages de esa regla
   - Disparar notificaciones según tipo
   ↓
5. Emitir evento WebSocket
```

**Acción Requerida**:

- Crear `AlertEvaluationService`
- Integrar con RawMeasurementService
- Implementar lógica de evaluación

**Conclusión**: ❌ **NO IMPLEMENTADO** - Servicio crítico faltante

---

## 🏗️ ENTIDADES REQUERIDAS vs IMPLEMENTADAS

| Entidad              | Estado          | Acción                  |
| -------------------- | --------------- | ----------------------- |
| **MessageGroup**     | ✅ Implementada | Listo                   |
| **AlertRule**        | ✅ Implementada | Listo                   |
| **AlertMessage**     | ⚠️ Parcial      | Refactorizar estructura |
| **Torreta**          | ❌ Faltante     | Crear módulo            |
| **TorretaColor**     | ❌ Faltante     | Crear módulo            |
| **AlertTrigger/Log** | ❌ Faltante     | Crear módulo            |
| **RawMeasurement**   | ✅ Existe       | Listo                   |
| **Measurement**      | ✅ Existe       | Listo                   |

---

## 🔧 REFACTORIZACIÓN NECESARIA DE ALERTMESSAGE

### Problema Actual

```typescript
// Estructura actual (demasiado genérica)
{
  receptorType: 'telegram' | 'torreta' | 'correo',
  receptorId: string,  // ← No sirve para todos los casos
  receptorName: string,
  messageContent: string  // ← No suficiente
}
```

### Estructura Propuesta

```typescript
// Nueva estructura (específica por tipo)
{
  receptorType: 'telegram' | 'torreta' | 'correo',
  messageGroupId: number,
  status: string,

  // Datos específicos según tipo (JSON)
  messageData: {
    // Para Telegram
    telegram?: {
      title: string,
      text: string
    },

    // Para Torreta
    torreta?: {
      torretaId: number,
      colorId: number
    },

    // Para Correo
    correo?: {
      emails: string[],
      subject: string,
      message: string
    }
  }
}
```

**Ventaja**:

- Flexible para cada tipo de mensaje
- No necesita múltiples campos nullable
- Fácil de extender

---

## 📦 NUEVOS MÓDULOS REQUERIDOS

### 1. **TorretasModule** ❌ FALTA

```typescript
Entidad: Torreta
Campos:
  - id: number (PK)
  - name: string
  - description: string
  - is_active: boolean
  - created_at, updated_at, deleted_at

Endpoints:
  - GET    /torretas
  - GET    /torretas/:id
  - POST   /torretas
  - PUT    /torretas/:id
  - PATCH  /torretas/:id/toggle
  - DELETE /torretas/:id

Propósito: Catálogo de torretas físicas disponibles
```

### 2. **TorretaColorsModule** ❌ FALTA

```typescript
Entidad: TorretaColor
Campos:
  - id: number (PK)
  - name: string (Ej: "Rojo", "Verde")
  - html_color: string (Ej: "#FF0000")
  - device_color_id: string (Ej: "R1", "G1" - código para hardware)
  - order: number
  - created_at, updated_at

Endpoints:
  - GET    /torreta-colors
  - GET    /torreta-colors/:id
  - POST   /torreta-colors
  - PUT    /torreta-colors/:id
  - DELETE /torreta-colors/:id

Datos precargados:
  - Rojo, Azul, Verde, Amarillo, Naranja, Morado, Rosa, Blanco

Propósito: Catálogo de colores disponibles para torretas
```

### 3. **AlertTriggersModule** ❌ FALTA (CRÍTICO)

```typescript
Entidad: AlertTrigger
Campos:
  - id: number (PK)
  - alert_rule_id: number (FK)
  - raw_measurement_id: number (FK)
  - measurement_value: decimal
  - condition_result: string (Ej: "75.5 > 75.0 = true")
  - messages_triggered: json (Array de IDs de mensajes)
  - triggered_at: timestamp

Endpoints:
  - GET    /alert-triggers
  - GET    /alert-triggers/:id
  - GET    /alert-rules/:ruleId/triggers
  - GET    /alert-triggers/stats

Propósito:
  - Historial de cuándo se dispararon alertas
  - Auditoría del sistema
  - Estadísticas de alertas
```

### 4. **AlertEvaluationService** ❌ FALTA (CRÍTICO)

```typescript
Servicio: AlertEvaluationService
Ubicación: alert-rules/application/services/

Métodos:
  - evaluateCondition(alertRule, value): boolean
  - evaluateAllRulesForMeasurement(measurementId, value): AlertRule[]
  - triggerAlerts(triggeredRules, rawMeasurement): void

Integración:
  - Llamado desde RawMeasurementService.processMeasurement()
  - Cada vez que llega un raw_measurement nuevo

Flujo:
  1. Llega raw_measurement
  2. Buscar AlertRules activas para ese measurement
  3. Evaluar cada condición
  4. Si cumple → Guardar en AlertTriggers + Disparar mensajes
  5. Emitir evento WebSocket
```

---

## 🔄 MODIFICACIONES A ALERTMESSAGE ENTITY

### Opción 1: Campo JSON (Recomendado)

```typescript
@Entity('alert_messages')
export class AlertMessage {
  // ... campos existentes

  @Column({ name: 'message_data', type: 'jsonb' })
  messageData!: {
    telegram?: { title: string; text: string };
    torreta?: { torretaId: number; colorId: number };
    correo?: { emails: string[]; subject: string; message: string };
  };
}
```

### Opción 2: Tablas Específicas por Tipo

```typescript
TelegramMessage extends AlertMessage
TorretaMessage extends AlertMessage
CorreoMessage extends AlertMessage
```

⚠️ Más complejo, no recomendado

### Opción 3: Mantener Campos Separados (Actual + Agregar)

```typescript
// Campos actuales
(receptorId, receptorName, messageContent);

// Agregar campos específicos
(telegram_title, telegram_text);
(torreta_id, color_id);
(email_addresses(json), email_subject);
```

⚠️ Muchos campos nullable, no escalable

**Recomendación**: **Opción 1 - Campo JSON**

---

## 📊 RESUMEN DE GAPS (Brechas)

### ✅ Lo que YA funciona

1. ✅ Guardar historial de raw_measurements
2. ✅ CRUD de AlertRules (condiciones)
3. ✅ CRUD de AlertMessages (mensajes)
4. ✅ CRUD de MessageGroups (grupos de escalación)
5. ✅ Activar/desactivar condiciones
6. ✅ Crear múltiples condiciones por sensor
7. ✅ Soft delete en AlertRules

### ❌ Lo que FALTA implementar

#### Alta Prioridad (Funcionalidad Crítica)

1. ❌ **AlertEvaluationService** - Evaluar condiciones en tiempo real
2. ❌ **AlertTriggersModule** - Historial de disparos
3. ❌ Refactorizar **AlertMessage** para soportar 3 tipos correctamente
4. ❌ Validación de **máximo 5 mensajes** por AlertRule

#### Media Prioridad (Catálogos)

5. ❌ **TorretasModule** - Catálogo de torretas
6. ❌ **TorretaColorsModule** - Catálogo de colores

#### Baja Prioridad (Mejoras)

7. ⏳ Servicios de envío de notificaciones (telegram, correo, torreta)
8. ⏳ Dashboard de estadísticas de alertas

---

## 🎯 PLAN DE ACCIÓN REVISADO

### Fase 1: Correcciones Críticas (Prioridad ALTA)

#### 1.1. Refactorizar AlertMessage Entity

```typescript
// Modificar alert-message.entity.ts
@Column({ name: 'message_data', type: 'jsonb' })
messageData!: object;

// Actualizar DTOs
messageData: {
  telegram?: { title: string; text: string };
  torreta?: { torretaId: number; colorId: number };
  correo?: { emails: string[]; subject: string; message: string };
}

// Actualizar ReceptorType enum
export enum ReceptorType {
  TELEGRAM = 'telegram',
  TORRETA = 'torreta',
  CORREO = 'correo',
}
```

#### 1.2. Crear TorretasModule

```
torretas/
├── domain/
│   ├── entities/torreta.entity.ts
│   └── repositories/torreta.repository.ts
├── application/
│   ├── dtos/torreta.dto.ts
│   └── services/torreta.service.ts
├── controllers/torreta.controller.ts
└── torretas.module.ts
```

#### 1.3. Crear TorretaColorsModule

```
torreta-colors/
├── domain/
│   ├── entities/torreta-color.entity.ts
│   └── repositories/torreta-color.repository.ts
├── application/
│   ├── dtos/torreta-color.dto.ts
│   └── services/torreta-color.service.ts
├── controllers/torreta-color.controller.ts
└── torreta-colors.module.ts

Datos precargados:
- Rojo: { htmlColor: "#ef4444", deviceColorId: "R1" }
- Verde: { htmlColor: "#22c55e", deviceColorId: "G1" }
- Azul: { htmlColor: "#3b82f6", deviceColorId: "B1" }
- Amarillo: { htmlColor: "#eab308", deviceColorId: "Y1" }
- etc...
```

#### 1.4. Validación de Máximo 5 Mensajes

```typescript
// En alert-message.service.ts
async createAlertMessage(ruleId, dto) {
  const existingMessages = await this.getMessagesByAlertRuleId(ruleId);

  if (existingMessages.length >= 5) {
    throw new BadRequestException(
      'Maximum 5 messages per alert rule exceeded'
    );
  }

  // ... resto del código
}
```

---

### Fase 2: Sistema de Evaluación (Prioridad ALTA)

#### 2.1. Crear AlertTriggersModule

```typescript
Entity: AlertTrigger
Propósito: Registrar cada vez que se dispara una alerta

Campos principales:
- alert_rule_id (FK)
- raw_measurement_id (FK)
- measurement_value (el valor que causó el disparo)
- condition_result (descripción de la evaluación)
- messages_sent (array de message IDs enviados)
- triggered_at (timestamp del disparo)
```

#### 2.2. Implementar AlertEvaluationService

```typescript
@Injectable()
export class AlertEvaluationService {
  async evaluateMeasurement(rawMeasurement: RawMeasurement): Promise<void> {
    // 1. Buscar measurement por externalId
    const measurement = await this.findMeasurement(rawMeasurement.externalId);

    if (!measurement) return;

    // 2. Obtener AlertRules activas para este measurement
    const activeRules = await this.alertRuleService.getEnabledAlertRules();
    const rulesForMeasurement = activeRules.filter(
      r => r.measurementId === measurement.id
    );

    // 3. Evaluar cada regla
    for (const rule of rulesForMeasurement) {
      const triggered = this.evaluateCondition(rule, rawMeasurement.value);

      if (triggered) {
        // 4. Guardar trigger
        await this.saveTrigger(rule, rawMeasurement);

        // 5. Disparar mensajes
        console.log('🚨 ALERTA DISPARADA:', rule.name);
        // TODO: Implementar envío de mensajes

        // 6. WebSocket notification
        this.webSocketService.emit('alert_triggered', {
          rule,
          value: rawMeasurement.value,
        });
      }
    }
  }

  private evaluateCondition(rule: AlertRule, value: string): boolean {
    const numValue = parseFloat(value);

    if (rule.mode === 'setpoint') {
      switch (rule.operator) {
        case '>':
          return numValue > rule.setpoint;
        case '>=':
          return numValue >= rule.setpoint;
        case '<':
          return numValue < rule.setpoint;
        case '<=':
          return numValue <= rule.setpoint;
        case '==':
          return numValue === rule.setpoint;
        case '!=':
          return numValue !== rule.setpoint;
        default:
          return false;
      }
    }

    if (rule.mode === 'window') {
      return numValue < rule.minValue || numValue > rule.maxValue;
    }

    return false;
  }
}
```

#### 2.3. Integrar con RawMeasurementService

```typescript
// En raw-measurement.service.ts
async processMeasurement(id: string, value: string): Promise<RawMeasurement> {
  const raw = await this.rawMeasurementRepository.create({ externalId: id, value });

  // WebSocket emit
  this.webSocketEmitterService.emit(...);

  // ✨ NUEVO: Evaluar condiciones
  await this.alertEvaluationService.evaluateMeasurement(raw);

  return raw;
}
```

---

## 📋 LISTA DE TAREAS PENDIENTES

### 🔴 Críticas (Sin esto el sistema NO funciona)

- [ ] Refactorizar `AlertMessage` para soportar 3 tipos de mensajes
- [ ] Crear `TorretasModule` (catálogo)
- [ ] Crear `TorretaColorsModule` (catálogo)
- [ ] Crear `AlertTriggersModule` (historial de disparos)
- [ ] Implementar `AlertEvaluationService` (evaluación de condiciones)
- [ ] Integrar evaluación con `RawMeasurementService`
- [ ] Agregar validación de máximo 5 mensajes

### 🟡 Importantes (Sistema funciona pero incompleto)

- [ ] Crear migración para modificar `alert_messages` table
- [ ] Actualizar `alert-message.dto.ts` con nuevos campos
- [ ] Actualizar frontend para soportar nuevos tipos de mensajes
- [ ] Crear endpoints de torretas y colores

### 🟢 Mejoras Futuras

- [ ] Implementar servicio de envío a Telegram
- [ ] Implementar servicio de control de torretas
- [ ] Implementar servicio de envío de correos
- [ ] Dashboard de estadísticas de alertas
- [ ] Sistema de notificaciones push (WebSocket)

---

## 🗂️ ESTRUCTURA DE ARCHIVOS A CREAR

```
backend-receptor/src/
├── torretas/
│   ├── domain/
│   │   ├── entities/torreta.entity.ts
│   │   └── repositories/torreta.repository.ts
│   ├── application/
│   │   ├── dtos/torreta.dto.ts
│   │   └── services/torreta.service.ts
│   ├── controllers/torreta.controller.ts
│   └── torretas.module.ts
│
├── torreta-colors/
│   ├── domain/
│   │   ├── entities/torreta-color.entity.ts
│   │   └── repositories/torreta-color.repository.ts
│   ├── application/
│   │   ├── dtos/torreta-color.dto.ts
│   │   └── services/torreta-color.service.ts
│   ├── controllers/torreta-color.controller.ts
│   └── torreta-colors.module.ts
│
├── alert-triggers/
│   ├── domain/
│   │   ├── entities/alert-trigger.entity.ts
│   │   └── repositories/alert-trigger.repository.ts
│   ├── application/
│   │   ├── dtos/alert-trigger.dto.ts
│   │   └── services/alert-trigger.service.ts
│   ├── controllers/alert-trigger.controller.ts
│   └── alert-triggers.module.ts
│
└── alert-rules/
    └── application/
        └── services/
            ├── alert-rule.service.ts (ya existe)
            └── alert-evaluation.service.ts (NUEVO)
```

---

## 📈 COMPARACIÓN: Implementado vs Requerido

### Módulos

| Módulo          | Implementado | Requerido | Gap  |
| --------------- | ------------ | --------- | ---- |
| MessageGroups   | ✅           | ✅        | 0%   |
| AlertRules      | ✅           | ✅        | 0%   |
| AlertMessages   | ⚠️           | ✅        | 40%  |
| Torretas        | ❌           | ✅        | 100% |
| TorretaColors   | ❌           | ✅        | 100% |
| AlertTriggers   | ❌           | ✅        | 100% |
| AlertEvaluation | ❌           | ✅        | 100% |

### Funcionalidad

| Característica            | Estado | Completitud |
| ------------------------- | ------ | ----------- |
| Guardar historial valores | ✅     | 100%        |
| Crear condiciones         | ✅     | 100%        |
| Activar/desactivar        | ✅     | 100%        |
| Múltiples condiciones     | ✅     | 100%        |
| Mensajes Telegram         | ❌     | 0%          |
| Mensajes Torreta          | ⚠️     | 30%         |
| Mensajes Correo           | ⚠️     | 40%         |
| Límite 5 mensajes         | ❌     | 0%          |
| Historial disparos        | ❌     | 0%          |
| Evaluación automática     | ❌     | 0%          |

**Completitud General**: **45%**

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### Opción A: Implementación Rápida (1 semana)

1. Refactorizar AlertMessage con campo JSON
2. Crear TorretasModule y TorretaColorsModule
3. Crear AlertTriggersModule
4. Implementar AlertEvaluationService básico
5. ✅ **Sistema funcional** (sin envío real de notificaciones)

### Opción B: Implementación Completa (2-3 semanas)

1. Todo lo de Opción A
2. Implementar servicio de Telegram Bot
3. Implementar servicio de control de torretas
4. Implementar servicio de correo (SMTP/SendGrid)
5. Dashboard de estadísticas
6. ✅ **Sistema completo y production-ready**

---

## 🚨 DECISIONES PENDIENTES

### 1. ¿Cómo manejar los receptores?

**Opción 1**: Mantener receptorId genérico + messageData JSON ✅  
**Opción 2**: Crear entidades específicas (TelegramUser, EmailUser)

**Recomendación**: Opción 1 (más flexible)

### 2. ¿Eliminar tipos de receptor no usados?

**Actual**: reloj, torreta, correo, generico  
**Requerido**: telegram, torreta, correo

**Acción**:

- Eliminar `reloj` y `generico`
- Agregar `telegram`

### 3. ¿Validar 5 mensajes en backend o frontend?

**Recomendación**: Ambos (backend = seguridad, frontend = UX)

---

## 📝 CONCLUSIÓN

### Estado Actual

```
╔══════════════════════════════════════════════════════╗
║  Funcionalidad Base:           ✅ 80% Completa       ║
║  Tipos de Mensajes:            ❌ 30% Completa       ║
║  Sistema de Evaluación:        ❌ 0% Completo        ║
║  Historial de Disparos:        ❌ 0% Completo        ║
║  Catálogos Requeridos:         ❌ 0% Completos       ║
║                                                      ║
║  COMPLETITUD TOTAL:            🟡 45%                ║
╚══════════════════════════════════════════════════════╝
```

### Próximos Pasos Sugeridos

**Orden de Implementación**:

1. ✅ **YA HECHO**: MessageGroups, AlertRules, AlertMessages (base)

2. **HACER AHORA** (Fase de Corrección):
   - Refactorizar AlertMessage con messageData JSON
   - Crear TorretasModule
   - Crear TorretaColorsModule
   - Agregar validación de 5 mensajes

3. **HACER DESPUÉS** (Fase de Evaluación):
   - Crear AlertTriggersModule
   - Implementar AlertEvaluationService
   - Integrar con RawMeasurementService

4. **OPCIONAL** (Fase de Servicios):
   - Servicios de envío real de notificaciones

---

## ❓ PREGUNTAS PARA EL USUARIO

1. ¿Quieres que refactorice los módulos YA creados o prefieres crear módulos nuevos adicionales?

2. ¿Procedo con la Opción A (rápida) u Opción B (completa)?

3. ¿Las torretas son dispositivos físicos reales o solo para UI?

4. ¿Telegram, correo y torreta son los ÚNICOS tipos de alerta o puede haber más en el futuro?

---

**Siguiente acción**: Esperar aprobación para comenzar con las correcciones y módulos faltantes.

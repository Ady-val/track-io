# Documentación Completa de la Base de Datos - Track.IO

> **Última actualización:** Generado automáticamente desde el esquema de la base de datos  
> **Base de datos:** PostgreSQL  
> **ORM:** TypeORM  
> **Nombre de BD:** `track_io`

---

## 📋 Tabla de Contenidos

1. [Configuración General](#configuración-general)
2. [Estructura de Entidades](#estructura-de-entidades)
3. [Relaciones entre Tablas](#relaciones-entre-tablas)
4. [Índices y Restricciones](#índices-y-restricciones)
5. [Migraciones](#migraciones)
6. [Scripts de Mantenimiento](#scripts-de-mantenimiento)
7. [Patrones y Convenciones](#patrones-y-convenciones)
8. [Sistema de Permisos](#sistema-de-permisos)

---

## 🔧 Configuración General

### Conexión a la Base de Datos

```typescript
// Configuración en app.module.ts y ormconfig.ts
{
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'track_io',
  synchronize: false, // Siempre false en producción
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}']
}
```

### Variables de Entorno

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=track_io
```

---

## 📊 Estructura de Entidades

### 1. Autenticación y Usuarios

#### `users` - Usuarios del Sistema

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `username` (varchar(255), UNIQUE, NOT NULL)
- `password` (varchar(255), NOT NULL) - Hash bcrypt
- `created_by` (varchar(255), nullable)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Índices:**
- `IDX_USERS_USERNAME` (UNIQUE) en `username`
- `IDX_USERS_CREATED_AT` en `created_at`
- `IDX_USERS_DELETED_AT` en `deleted_at`

**Relaciones:**
- `sessions` (OneToMany) → Tabla `sessions`
- `roles` (ManyToMany) → Tabla `roles` vía `user_roles`
- `userRoles` (OneToMany) → Tabla `user_roles`

**Entidad TypeORM:** `backend-receptor/src/users/domain/entities/user.entity.ts`

---

#### `sessions` - Sesiones de Usuario

**Campos:**
- `id` (integer, PK, auto-increment)
- `user_id` (integer, NOT NULL, FK → users.id)
- `token` (varchar(500), UNIQUE, NOT NULL) - JWT token
- `ip_address` (varchar(45), nullable)
- `user_agent` (text, nullable)
- `created_at` (timestamp with time zone, NOT NULL, default: now())

**Índices:**
- `IDX_SESSIONS_TOKEN` (UNIQUE) en `token`
- `IDX_SESSIONS_USER_ID` en `user_id`
- `IDX_SESSIONS_CREATED_AT` en `created_at`

**Foreign Keys:**
- `FK_SESSIONS_USER_ID`: `user_id` → `users.id` (ON DELETE CASCADE)

**Entidad TypeORM:** `backend-receptor/src/auth/domain/entities/session.entity.ts`

---

### 2. Permisos y Roles (RBAC)

#### `roles` - Roles del Sistema

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `description` (text, nullable)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Índices:**
- `IDX_ROLES_NAME_UNIQUE` (UNIQUE PARTIAL) en `name` WHERE `deleted_at IS NULL`
  - ⚠️ **Importante:** Permite nombres duplicados si el rol anterior fue eliminado (soft delete)

**Relaciones:**
- `users` (ManyToMany) → Tabla `users` vía `user_roles`
- `permissions` (ManyToMany) → Tabla `permissions` vía `role_permissions`

**Entidad TypeORM:** `backend-receptor/src/permissions/domain/entities/role.entity.ts`

**Scripts relacionados:**
- `scripts/fix-roles-unique-constraint.ts` - Corrige la restricción única

---

#### `permissions` - Permisos del Sistema

**Campos:**
- `id` (integer, PK, auto-increment)
- `module` (varchar(100), NOT NULL)
- `action` (varchar(50), NOT NULL)
- `description` (text, nullable)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Índices:**
- `IDX_PERMISSIONS_MODULE_ACTION` (UNIQUE) en `(module, action)`

**Módulos disponibles:**
- `catalogs` - Unifica: areas, departments, torretas, torreta-colors, receptors, emails
- `devices` - Dispositivos
- `measurements` - Mediciones
- `signals` - Señales
- `raw-measurements` - Mediciones en crudo
- `message-groups` - Grupos de mensajes
- `measurement-alerts` - Unifica: alert-rules, alert-messages
- `alert-triggers` - Disparadores de alertas
- `area-downtime` - Tiempos de inactividad
- `area-torreta-config` - Configuración área-torreta
- `events` - Eventos
- `users` - Usuarios
- `dashboard` - Dashboard
- `roles-and-permissions` - Unifica: roles, permissions

**Acciones disponibles:**
- `create` - Crear
- `read` - Leer
- `update` - Actualizar
- `delete` - Eliminar

**Relaciones:**
- `roles` (ManyToMany) → Tabla `roles` vía `role_permissions`

**Entidad TypeORM:** `backend-receptor/src/permissions/domain/entities/permission.entity.ts`

**Scripts relacionados:**
- `scripts/create-roles-and-permissions-permissions.ts` - Crea permisos del módulo roles-and-permissions
- `scripts/ensure-roles-and-permissions-permissions.ts` - Asegura que existan los permisos

---

#### `user_roles` - Relación Usuarios-Roles (Tabla Intermedia)

**Campos:**
- `user_id` (integer, PK, FK → users.id)
- `role_id` (integer, PK, FK → roles.id)
- `created_at` (timestamp with time zone, NOT NULL, default: now())

**Índices:**
- `IDX_USER_ROLES_USER_ID` en `user_id`
- `IDX_USER_ROLES_ROLE_ID` en `role_id`

**Foreign Keys:**
- `FK_USER_ROLES_USER_ID`: `user_id` → `users.id` (ON DELETE CASCADE)
- `FK_USER_ROLES_ROLE_ID`: `role_id` → `roles.id` (ON DELETE CASCADE)

**Entidad TypeORM:** `backend-receptor/src/permissions/domain/entities/user-role.entity.ts`

---

#### `role_permissions` - Relación Roles-Permisos (Tabla Intermedia)

**Campos:**
- `role_id` (integer, PK, FK → roles.id)
- `permission_id` (integer, PK, FK → permissions.id)
- `created_at` (timestamp with time zone, NOT NULL, default: now())

**Índices:**
- `IDX_ROLE_PERMISSIONS_ROLE_ID` en `role_id`
- `IDX_ROLE_PERMISSIONS_PERMISSION_ID` en `permission_id`

**Foreign Keys:**
- `FK_ROLE_PERMISSIONS_ROLE_ID`: `role_id` → `roles.id` (ON DELETE CASCADE)
- `FK_ROLE_PERMISSIONS_PERMISSION_ID`: `permission_id` → `permissions.id` (ON DELETE CASCADE)

**Entidad TypeORM:** `backend-receptor/src/permissions/domain/entities/role-permission.entity.ts`

---

### 3. Catálogos y Organización

#### `areas` - Áreas de la Organización

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Índices:**
- `IDX_AREAS_CREATED_AT` en `created_at`
- `IDX_AREAS_DELETED_AT` en `deleted_at`

**Relaciones:**
- `devices` (OneToMany) → Tabla `devices`
- `events` (OneToMany) → Tabla `events`
- `areaDowntimes` (OneToMany) → Tabla `area_downtimes`
- `areaTorretaConfigs` (OneToMany) → Tabla `area_torreta_configs`

**Entidad TypeORM:** `backend-receptor/src/areas/domain/entities/area.entity.ts`

---

#### `departments` - Departamentos

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `html_color` (varchar(7), nullable) - Color HTML (ej: #FF0000)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Relaciones:**
- `deviceSignals` (OneToMany) → Tabla `device_signals`
- `events` (OneToMany) → Tabla `events`

**Entidad TypeORM:** `backend-receptor/src/departments/domain/entities/department.entity.ts`

**Migración:** `1730710915000-AddHtmlColorToDepartments.ts`

---

#### `devices` - Dispositivos

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `area_id` (integer, NOT NULL, FK → areas.id)
- `external_id` (varchar(255), UNIQUE, NOT NULL)
- `is_virtual_device` (boolean, NOT NULL, default: false)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Índices:**
- `IDX_DEVICES_EXTERNAL_ID` en `external_id`
- `IDX_DEVICES_AREA_ID` en `area_id`
- `IDX_DEVICES_CREATED_AT` en `created_at`
- `IDX_DEVICES_DELETED_AT` en `deleted_at`

**Foreign Keys:**
- `FK_devices_area_id`: `area_id` → `areas.id` (ON DELETE RESTRICT, ON UPDATE CASCADE)

**Relaciones:**
- `area` (ManyToOne) → Tabla `areas`
- `deviceSignals` (OneToMany) → Tabla `device_signals`
- `events` (OneToMany) → Tabla `events`

**Entidad TypeORM:** `backend-receptor/src/devices/domain/entities/device.entity.ts`

**Migraciones:**
- `1704067320000-CreateDevicesTable.ts`
- `1704068800000-AddIsVirtualDeviceToDevices.ts`

---

#### `device_signals` - Señales de Dispositivos

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `device_id` (integer, NOT NULL, FK → devices.id)
- `department_id` (integer, NOT NULL, FK → departments.id)
- `external_value_id` (varchar(255), NOT NULL)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Índices:**
- `IDX_device_signals_device_id` en `device_id`
- `IDX_device_signals_department_id` en `department_id`
- `IDX_device_signals_external_value_id` en `external_value_id`

**Foreign Keys:**
- `FK_device_signals_device_id`: `device_id` → `devices.id`
- `FK_device_signals_department_id`: `department_id` → `departments.id`

**Relaciones:**
- `device` (ManyToOne) → Tabla `devices`
- `department` (ManyToOne) → Tabla `departments`
- `events` (OneToMany) → Tabla `events`

**Entidad TypeORM:** `backend-receptor/src/device-signals/domain/entities/device-signal.entity.ts`

**Migraciones:**
- `1704067380000-CreateDeviceSignalsTable.ts`
- `1704068500000-RemoveExternalValueIdUniqueConstraint.ts`

---

#### `torretas` - Torretas del Sistema

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `description` (varchar(500), nullable)
- `external_id` (varchar(255), UNIQUE, nullable)
- `is_active` (boolean, NOT NULL, default: true)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Índices:**
- `IDX_torretas_external_id` (UNIQUE) en `external_id`

**Entidad TypeORM:** `backend-receptor/src/torretas/domain/entities/torreta.entity.ts`

**Migraciones:**
- `1704067860000-CreateTorretasTable.ts`
- `1704068700000-AddExternalIdToTorretas.ts`

---

#### `torreta_colors` - Colores de Torretas

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `color_code` (varchar(7), NOT NULL) - Código de color HTML
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Entidad TypeORM:** `backend-receptor/src/torreta-colors/domain/entities/torreta-color.entity.ts`

**Migración:** `1704067900000-CreateTorretaColorsTable.ts`

---

#### `receptors` - Receptores

**Campos:**
- `id` (integer, PK, auto-increment)
- `external_id` (varchar(255), UNIQUE, NOT NULL)
- `name` (varchar(255), NOT NULL)
- `is_active` (boolean, NOT NULL, default: true)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Índices:**
- `IDX_receptors_external_id` (UNIQUE) en `external_id`

**Entidad TypeORM:** `backend-receptor/src/receptors/domain/entities/receptor.entity.ts`

**Migración:** `1704068040000-CreateReceptorsTable.ts`

---

#### `emails` - Emails del Sistema

**Campos:**
- `id` (integer, PK, auto-increment)
- `email` (varchar(255), NOT NULL)
- `name` (varchar(255), NOT NULL)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Entidad TypeORM:** `backend-receptor/src/emails/domain/entities/email.entity.ts`

**Migración:** `1730001000000-CreateEmailsTable.ts`

---

### 4. Mediciones y Señales

#### `measurements` - Tipos de Mediciones

**Campos:**
- `id` (integer, PK, auto-increment)
- `external_id` (varchar(255), UNIQUE, NOT NULL)
- `name` (varchar(255), NOT NULL)
- `type` (enum, NOT NULL) - Valores: `temperature`, `humidity`, `pressure`, `level`, `flow`, `vibration`
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Índices:**
- `IDX_measurements_external_id` (UNIQUE) en `external_id`

**Relaciones:**
- `measurementValues` (OneToMany) → Tabla `measurement_values`
- `alertRules` (OneToMany) → Tabla `alert_rules`
- `dashboardMeasurements` (OneToMany) → Tabla `dashboard_measurements`

**Entidad TypeORM:** `backend-receptor/src/measurements/domain/entities/measurement.entity.ts`

**Migración:** `1704067500000-CreateMeasurementsTable.ts`

---

#### `measurement_values` - Valores de Mediciones

**Campos:**
- `id` (integer, PK, auto-increment)
- `measurement_id` (integer, NOT NULL, FK → measurements.id)
- `value` (varchar(255), NOT NULL)
- `created_at` (timestamp with time zone, NOT NULL, default: now())

**Índices:**
- `IDX_measurement_values_measurement_id` en `measurement_id`
- `IDX_measurement_values_created_at` en `created_at`

**Foreign Keys:**
- `FK_measurement_values_measurement_id`: `measurement_id` → `measurements.id` (ON DELETE CASCADE)

**Relaciones:**
- `measurement` (ManyToOne) → Tabla `measurements`

**Entidad TypeORM:** `backend-receptor/src/measurements/domain/entities/measurement-value.entity.ts`

**Migración:** `1704067560000-CreateMeasurementValuesTable.ts`

---

#### `raw_measurements` - Mediciones en Crudo

**Campos:**
- `id` (integer, PK, auto-increment)
- `external_id` (varchar(255), NOT NULL)
- `value` (varchar(255), NOT NULL)
- `virtual_device` (boolean, NOT NULL, default: false)
- `reason` (varchar(255), nullable)
- `comment` (text, nullable)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Índices:**
- `IDX_raw_measurements_external_id` en `external_id`
- `IDX_raw_measurements_created_at` en `created_at`

**Entidad TypeORM:** `backend-receptor/src/raw-measurements/domain/entities/raw-measurement.entity.ts`

**Migraciones:**
- `1704067440000-CreateRawMeasurementsTable.ts`
- `1730000000000-AddVirtualDeviceFields.ts`

---

#### `raw_signals` - Señales en Crudo

**Campos:**
- `id` (integer, PK, auto-increment)
- `external_id` (varchar(255), NOT NULL)
- `value` (varchar(255), NOT NULL)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Entidad TypeORM:** `backend-receptor/src/signals/domain/entities/raw-signal.entity.ts`

**Migración:** `1704067420000-CreateRawSignalsTable.ts`

---

#### `processed_signals` - Señales Procesadas

**Campos:**
- `id` (integer, PK, auto-increment)
- `external_id` (varchar(255), NOT NULL)
- `value` (varchar(255), NOT NULL)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Entidad TypeORM:** `backend-receptor/src/signals/domain/entities/processed-signal.entity.ts`

**Migración:** `1704068160000-CreateProcessedSignalsTable.ts`

---

### 5. Alertas y Mensajería

#### `alert_rules` - Reglas de Alertas

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `measurement_id` (integer, NOT NULL, FK → measurements.id)
- `mode` (enum, NOT NULL) - Valores: `setpoint`, `window`
- `operator` (varchar(10), nullable) - Para modo setpoint: `>`, `<`, `>=`, `<=`, `=`
- `setpoint` (decimal(10,2), nullable) - Valor de referencia para modo setpoint
- `min_value` (decimal(10,2), nullable) - Valor mínimo para modo window
- `max_value` (decimal(10,2), nullable) - Valor máximo para modo window
- `is_enabled` (boolean, NOT NULL, default: true)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Índices:**
- `IDX_alert_rules_measurement_id` en `measurement_id`
- `IDX_alert_rules_is_enabled` en `is_enabled`

**Foreign Keys:**
- `FK_alert_rules_measurement_id`: `measurement_id` → `measurements.id`

**Relaciones:**
- `measurement` (ManyToOne) → Tabla `measurements`
- `alertMessages` (OneToMany) → Tabla `alert_messages`

**Entidad TypeORM:** `backend-receptor/src/alert-rules/domain/entities/alert-rule.entity.ts`

**Migración:** `1704067680000-CreateAlertRulesTable.ts`

---

#### `alert_messages` - Mensajes de Alerta

**Campos:**
- `id` (integer, PK, auto-increment)
- `alert_rule_id` (integer, NOT NULL, FK → alert_rules.id)
- `receptor_type` (enum, NOT NULL) - Valores: `telegram`, `torreta`, `correo`, `receptor`
- `message_data` (jsonb, NOT NULL) - Datos del mensaje según tipo:
  - `telegram`: `{ title: string, text: string }`
  - `torreta`: `{ torretaId: number, colorId: number }`
  - `correo`: `{ emails: string[], subject: string, message: string }`
  - `receptor`: `{ receptorId: number, message: string }`
- `message_group_id` (integer, NOT NULL, FK → message_groups.id)
- `status` (varchar(50), NOT NULL, default: 'pending')
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Índices:**
- `IDX_alert_messages_alert_rule_id` en `alert_rule_id`
- `IDX_alert_messages_message_group_id` en `message_group_id`

**Foreign Keys:**
- `FK_alert_messages_alert_rule_id`: `alert_rule_id` → `alert_rules.id`
- `FK_alert_messages_message_group_id`: `message_group_id` → `message_groups.id`

**Relaciones:**
- `alertRule` (ManyToOne) → Tabla `alert_rules`
- `messageGroup` (ManyToOne) → Tabla `message_groups`

**Entidad TypeORM:** `backend-receptor/src/alert-messages/domain/entities/alert-message.entity.ts`

**Migraciones:**
- `1704067740000-CreateAlertMessagesTable.ts`
- `1704067800000-RefactorAlertMessagesTable.ts`

---

#### `message_groups` - Grupos de Mensajes

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(100), UNIQUE, NOT NULL)
- `color` (varchar(7), NOT NULL) - Color HTML
- `description` (varchar(255), NOT NULL)
- `order` (integer, NOT NULL, default: 0)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Índices:**
- `IDX_message_groups_name` (UNIQUE) en `name`

**Relaciones:**
- `alertMessages` (OneToMany) → Tabla `alert_messages`

**Entidad TypeORM:** `backend-receptor/src/message-groups/domain/entities/message-group.entity.ts`

**Migración:** `1704067620000-CreateMessageGroupsTable.ts`

---

#### `alert_triggers` - Disparadores de Alertas

**Campos:**
- `id` (integer, PK, auto-increment)
- `alert_rule_id` (integer, NOT NULL, FK → alert_rules.id)
- `measurement_value_id` (integer, NOT NULL, FK → measurement_values.id)
- `status` (varchar(50), NOT NULL)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Entidad TypeORM:** `backend-receptor/src/alert-triggers/domain/entities/alert-trigger.entity.ts`

**Migración:** `1704067980000-CreateAlertTriggersTable.ts`

---

#### `alert_escalation_configs` - Configuración de Escalación

**Campos:**
- `id` (integer, PK, auto-increment)
- `device_id` (integer, NOT NULL)
- `device_signal_id` (integer, NOT NULL)
- `endpoint_url` (varchar, NOT NULL, default: 'http://host.docker.internal:1880/events')
- `warning_delay_minutes` (integer, NOT NULL, default: 20)
- `escalation1_delay_minutes` (integer, NOT NULL, default: 40)
- `escalation2_delay_minutes` (integer, NOT NULL, default: 60)
- `escalation3_delay_minutes` (integer, NOT NULL, default: 80)
- `is_active` (boolean, NOT NULL, default: true)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Entidad TypeORM:** `backend-receptor/src/alert-escalation/domain/entities/alert-escalation-config.entity.ts`

**Migración:** `1704068600000-CreateAlertEscalationTables.ts`

---

#### `alert_escalation_messages` - Mensajes de Escalación

**Campos:**
- `id` (integer, PK, auto-increment)
- `escalation_config_id` (integer, NOT NULL, FK → alert_escalation_configs.id)
- `alert_message_id` (integer, NOT NULL, FK → alert_messages.id)
- `sent_at` (timestamp with time zone, nullable)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Entidad TypeORM:** `backend-receptor/src/alert-escalation/domain/entities/alert-escalation-message.entity.ts`

**Migración:** `1704068600000-CreateAlertEscalationTables.ts`

---

#### `event_alert_logs` - Log de Alertas de Eventos

**Campos:**
- `id` (integer, PK, auto-increment)
- `event_id` (integer, NOT NULL, FK → events.id)
- `alert_message_id` (integer, NOT NULL, FK → alert_messages.id)
- `sent_at` (timestamp with time zone, nullable)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Entidad TypeORM:** `backend-receptor/src/alert-escalation/domain/entities/event-alert-log.entity.ts`

**Migración:** `1704068600000-CreateAlertEscalationTables.ts`

---

### 6. Eventos y Downtime

#### `events` - Eventos del Sistema

**Campos:**
- `id` (integer, PK, auto-increment)
- `area_id` (integer, NOT NULL, FK → areas.id)
- `area_name` (varchar(255), NOT NULL) - Denormalizado para performance
- `department_id` (integer, NOT NULL, FK → departments.id)
- `department_name` (varchar(255), NOT NULL) - Denormalizado para performance
- `device_id` (integer, NOT NULL, FK → devices.id)
- `device_name` (varchar(255), NOT NULL) - Denormalizado para performance
- `device_signal_id` (integer, NOT NULL, FK → device_signals.id)
- `device_signal_name` (varchar(255), NOT NULL) - Denormalizado para performance
- `status` (enum, NOT NULL, default: 'open') - Valores: `open`, `in-progress`, `closed`
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `in_progress_at` (timestamp with time zone, nullable)
- `closed_at` (timestamp with time zone, nullable)
- `duration_seconds` (integer, nullable) - Duración calculada en segundos
- `virtual_device` (boolean, NOT NULL, default: false)
- `reason` (varchar(255), nullable)
- `comment` (text, nullable)

**Índices:**
- `IDX_events_area_id_department_id` en `(area_id, department_id)`
- `IDX_events_device_id_device_signal_id` en `(device_id, device_signal_id)`
- `IDX_events_status` en `status`
- `IDX_events_created_at` en `created_at`

**Foreign Keys:**
- `FK_events_area_id`: `area_id` → `areas.id`
- `FK_events_department_id`: `department_id` → `departments.id`
- `FK_events_device_id`: `device_id` → `devices.id`
- `FK_events_device_signal_id`: `device_signal_id` → `device_signals.id`

**Relaciones:**
- `area` (ManyToOne) → Tabla `areas`
- `department` (ManyToOne) → Tabla `departments`
- `device` (ManyToOne) → Tabla `devices`
- `deviceSignal` (ManyToOne) → Tabla `device_signals`
- `eventAlertLogs` (OneToMany) → Tabla `event_alert_logs`
- `areaDowntimeEvents` (OneToMany) → Tabla `area_downtime_events`

**Entidad TypeORM:** `backend-receptor/src/events/domain/entities/event.entity.ts`

**Migraciones:**
- `1704068220000-CreateEventsTable.ts`
- `1730000000000-AddVirtualDeviceFields.ts`

---

#### `area_downtimes` - Tiempos de Inactividad de Áreas

**Campos:**
- `id` (integer, PK, auto-increment)
- `area_id` (integer, NOT NULL, FK → areas.id)
- `start_time` (timestamp with time zone, NOT NULL)
- `end_time` (timestamp with time zone, nullable)
- `reason` (varchar(255), nullable)
- `comment` (text, nullable)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Relaciones:**
- `area` (ManyToOne) → Tabla `areas`
- `areaDowntimeEvents` (OneToMany) → Tabla `area_downtime_events`

**Entidad TypeORM:** `backend-receptor/src/area-downtime/domain/entities/area-downtime.entity.ts`

**Migración:** `1704068300000-CreateAreaDowntimesTable.ts`

---

#### `area_downtime_events` - Eventos de Downtime

**Campos:**
- `id` (integer, PK, auto-increment)
- `area_downtime_id` (integer, NOT NULL, FK → area_downtimes.id)
- `event_id` (integer, NOT NULL, FK → events.id)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Relaciones:**
- `areaDowntime` (ManyToOne) → Tabla `area_downtimes`
- `event` (ManyToOne) → Tabla `events`

**Entidad TypeORM:** `backend-receptor/src/area-downtime/domain/entities/area-downtime-event.entity.ts`

**Migración:** `1704068400000-CreateAreaDowntimeEventsTable.ts`

---

### 7. Dashboard y Configuración

#### `dashboard_measurements` - Mediciones del Dashboard

**Campos:**
- `id` (integer, PK, auto-increment)
- `measurement_id` (integer, NOT NULL, FK → measurements.id)
- `group_id` (integer, nullable, FK → dashboard_measurement_groups.id)
- `min_value` (decimal(10,2), NOT NULL)
- `max_value` (decimal(10,2), NOT NULL)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Foreign Keys:**
- `FK_dashboard_measurements_measurement_id`: `measurement_id` → `measurements.id` (ON DELETE CASCADE)
- `FK_dashboard_measurements_group_id`: `group_id` → `dashboard_measurement_groups.id` (ON DELETE SET NULL)

**Relaciones:**
- `measurement` (ManyToOne) → Tabla `measurements`
- `group` (ManyToOne) → Tabla `dashboard_measurement_groups`

**Entidad TypeORM:** `backend-receptor/src/dashboard-measurements/domain/entities/dashboard-measurement.entity.ts`

**Migraciones:**
- `1704068100000-CreateDashboardMeasurementsTable.ts`
- `1739000000000-RemoveDashboardMeasurementsUniqueConstraint.ts`

---

#### `dashboard_measurement_groups` - Grupos de Mediciones del Dashboard

**Campos:**
- `id` (integer, PK, auto-increment)
- `name` (varchar(255), NOT NULL)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Relaciones:**
- `dashboardMeasurements` (OneToMany) → Tabla `dashboard_measurements`

**Entidad TypeORM:** `backend-receptor/src/dashboard-measurements/domain/entities/dashboard-measurement-group.entity.ts`

**Migración:** `1731000000000-CreateDashboardMeasurementGroupsTable.ts`

---

#### `area_torreta_configs` - Configuración Área-Torreta

**Campos:**
- `id` (integer, PK, auto-increment)
- `area_id` (integer, NOT NULL, FK → areas.id)
- `torreta_id` (integer, NOT NULL, FK → torretas.id)
- `color_id` (integer, NOT NULL, FK → torreta_colors.id)
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())
- `deleted_at` (timestamp with time zone, nullable) - Soft delete

**Relaciones:**
- `area` (ManyToOne) → Tabla `areas`
- `torreta` (ManyToOne) → Tabla `torretas`
- `color` (ManyToOne) → Tabla `torreta_colors`

**Entidad TypeORM:** `backend-receptor/src/area-torreta-config/domain/entities/area-torreta-config.entity.ts`

**Migración:** `1730800000000-CreateAreaTorretaConfigsTable.ts`

---

### 8. Tabla de Migraciones

#### `migrations` - Control de Migraciones de TypeORM

**Campos:**
- `id` (integer, PK, auto-increment)
- `timestamp` (bigint, NOT NULL)
- `name` (varchar, NOT NULL)

Esta tabla es gestionada automáticamente por TypeORM para llevar el registro de las migraciones ejecutadas.

---

## 🔗 Relaciones entre Tablas

### Diagrama de Relaciones Principales

```
┌─────────┐         ┌──────────┐         ┌─────────────┐
│  Users  │◄───────┤ Sessions │         │   Roles     │
└────┬────┘         └──────────┘         └──────┬───────┘
     │                                          │
     │ ManyToMany                               │ ManyToMany
     │                                          │
     ▼                                          ▼
┌─────────────┐                        ┌──────────────┐
│ user_roles  │                        │role_permissions│
└─────────────┘                        └──────────────┘
     │                                          │
     │                                          │
     └──────────────────────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │  Permissions  │
              └───────────────┘

┌─────────┐         ┌──────────┐         ┌──────────────┐
│  Areas   │────────┤ Devices  │─────────┤device_signals│
└────┬─────┘         └────┬─────┘         └──────┬───────┘
     │                    │                      │
     │                    │                      │
     ▼                    ▼                      ▼
┌─────────────┐    ┌──────────┐         ┌──────────────┐
│area_downtimes│    │  Events  │         │ Departments │
└─────────────┘    └──────────┘         └──────────────┘

┌──────────────┐         ┌──────────────────┐
│ Measurements │─────────┤measurement_values│
└──────┬───────┘         └──────────────────┘
       │
       │
       ▼
┌──────────────┐         ┌──────────────┐
│ alert_rules   │─────────┤alert_messages│
└──────────────┘         └──────┬───────┘
                                │
                                ▼
                        ┌──────────────┐
                        │message_groups│
                        └──────────────┘
```

### Relaciones Detalladas

#### Autenticación y Permisos
- `users` ↔ `roles` (ManyToMany vía `user_roles`)
- `roles` ↔ `permissions` (ManyToMany vía `role_permissions`)
- `users` → `sessions` (OneToMany)

#### Organización
- `areas` → `devices` (OneToMany)
- `devices` → `device_signals` (OneToMany)
- `departments` → `device_signals` (OneToMany)
- `areas` → `area_downtimes` (OneToMany)
- `areas` → `area_torreta_configs` (OneToMany)
- `areas` → `events` (OneToMany)

#### Mediciones y Alertas
- `measurements` → `measurement_values` (OneToMany)
- `measurements` → `alert_rules` (OneToMany)
- `measurements` → `dashboard_measurements` (OneToMany)
- `alert_rules` → `alert_messages` (OneToMany)
- `message_groups` → `alert_messages` (OneToMany)

#### Eventos
- `events` → `area_downtime_events` (OneToMany)
- `events` → `event_alert_logs` (OneToMany)
- `areas` → `events` (OneToMany)
- `departments` → `events` (OneToMany)
- `devices` → `events` (OneToMany)
- `device_signals` → `events` (OneToMany)

---

## 📑 Índices y Restricciones

### Índices Únicos

1. **`users.username`** - Username único por usuario
2. **`roles.name`** - Nombre único parcial (solo cuando `deleted_at IS NULL`)
3. **`permissions.module + action`** - Combinación única de módulo y acción
4. **`measurements.external_id`** - External ID único por medición
5. **`receptors.external_id`** - External ID único por receptor
6. **`torretas.external_id`** - External ID único por torreta (nullable)
7. **`devices.external_id`** - External ID único por dispositivo
8. **`message_groups.name`** - Nombre único por grupo de mensajes
9. **`sessions.token`** - Token único por sesión

### Índices Compuestos

1. **`events(area_id, department_id)`** - Optimización de consultas por área y departamento
2. **`events(device_id, device_signal_id)`** - Optimización de consultas por dispositivo y señal
3. **`permissions(module, action)`** - Búsqueda rápida de permisos

### Índices de Performance

- `created_at` en la mayoría de tablas para ordenamiento temporal
- `deleted_at` en tablas con soft delete para filtrado
- `status` en tablas con estados (events, alert_messages)
- `is_enabled` / `is_active` en tablas con flags de activación

### Restricciones de Foreign Keys

Todas las foreign keys están configuradas con:
- **ON DELETE CASCADE** para tablas intermedias (user_roles, role_permissions)
- **ON DELETE RESTRICT** para relaciones críticas (devices → areas)
- **ON DELETE SET NULL** para relaciones opcionales (dashboard_measurements → groups)
- **ON UPDATE CASCADE** donde aplica

---

## 🔄 Migraciones

### Sistema de Migraciones Consolidado

**Estado Actual:** Todas las migraciones anteriores (38 migraciones) han sido consolidadas en una única migración inicial.

### Migración Inicial

**`1000000000000-InitialSchema.ts`** - Migración inicial única
- Contiene todo el esquema completo de la base de datos
- Incluye todas las tablas, índices, foreign keys, constraints y enums
- Incluye datos iniciales críticos:
  - `permissions` (56 registros)
  - `message_groups` (5 registros)
  - `torreta_colors` (8 registros)
- Todas las migraciones anteriores fueron consolidadas en esta

### Migraciones Futuras

Las nuevas migraciones se crearán para cambios incrementales después de la migración inicial.

### Migraciones Archivadas

Las 38 migraciones anteriores están archivadas en: `src/migrations/archive/`

**Lista de Migraciones Archivadas (referencia histórica):**

1. **`1704067200000`** - CreateAreasTable
2. **`1704067260000`** - CreateDepartmentsTable
3. **`1704067320000`** - CreateDevicesTable
4. **`1704067380000`** - CreateDeviceSignalsTable
5. **`1704067420000`** - CreateRawSignalsTable
6. **`1704067440000`** - CreateRawMeasurementsTable
7. **`1704067500000`** - CreateMeasurementsTable
8. **`1704067560000`** - CreateMeasurementValuesTable
9. **`1704067620000`** - CreateMessageGroupsTable
10. **`1704067680000`** - CreateAlertRulesTable
11. **`1704067740000`** - CreateAlertMessagesTable
12. **`1704067800000`** - RefactorAlertMessagesTable
13. **`1704067860000`** - CreateTorretasTable
14. **`1704067900000`** - CreateTorretaColorsTable
15. **`1704067980000`** - CreateAlertTriggersTable
16. **`1704068040000`** - CreateReceptorsTable
17. **`1704068100000`** - CreateDashboardMeasurementsTable
18. **`1704068160000`** - CreateProcessedSignalsTable
19. **`1704068220000`** - CreateEventsTable
20. **`1704068300000`** - CreateAreaDowntimesTable
21. **`1704068400000`** - CreateAreaDowntimeEventsTable
22. **`1704068500000`** - RemoveExternalValueIdUniqueConstraint
23. **`1704068600000`** - CreateAlertEscalationTables
24. **`1704068700000`** - AddExternalIdToTorretas
25. **`1704068800000`** - AddIsVirtualDeviceToDevices
26. **`1730000000000`** - AddVirtualDeviceFields
27. **`1730001000000`** - CreateEmailsTable
28. **`1730710915000`** - AddHtmlColorToDepartments
29. **`1730800000000`** - CreateAreaTorretaConfigsTable
30. **`1731000000000`** - CreateDashboardMeasurementGroupsTable
31. **`1732000000000`** - CreateUsersAndSessionsTables
32. **`1733000000000`** - CreateRolesAndPermissionsTables
33. **`1734000000000`** - UpdateRolesNameUniqueConstraint
34. **`1735000000000`** - UnifyAlertModulesToMeasurementAlerts
35. **`1736000000000`** - UnifyDeviceModulesToDevices
36. **`1737000000000`** - UnifyRolesAndPermissionsModules
37. **`1738000000000`** - UnifyCatalogModulesToCatalogs
38. **`1739000000000`** - RemoveDashboardMeasurementsUniqueConstraint

> **Nota:** Todas estas migraciones han sido consolidadas en `1000000000000-InitialSchema.ts`

### Migraciones Importantes (Histórico)

#### Unificación de Módulos

**`1737000000000-UnifyRolesAndPermissionsModules`**
- Unifica módulos `roles` y `permissions` en `roles-and-permissions`
- Migra referencias en `role_permissions`
- Elimina permisos antiguos

**`1738000000000-UnifyCatalogModulesToCatalogs`**
- Unifica módulos: `areas`, `departments`, `torretas`, `torreta-colors`, `receptors`, `emails`
- Nuevo módulo: `catalogs`
- Migra referencias en `role_permissions`

**`1735000000000-UnifyAlertModulesToMeasurementAlerts`**
- Unifica módulos `alert-rules` y `alert-messages` en `measurement-alerts`
- Migra referencias en `role_permissions`

**`1736000000000-UnifyDeviceModulesToDevices`**
- Unifica módulos relacionados con dispositivos en `devices`

#### Restricciones Únicas

**`1734000000000-UpdateRolesNameUniqueConstraint`**
- Cambia restricción única de `roles.name` a índice parcial único
- Permite nombres duplicados si el rol anterior fue eliminado (soft delete)
- Crea índice: `IDX_ROLES_NAME_UNIQUE` WHERE `deleted_at IS NULL`

---

## 🛠️ Scripts de Mantenimiento

### Ubicación
Todos los scripts están en: `backend-receptor/scripts/`

### Scripts Disponibles

#### 1. `create-roles-and-permissions-permissions.ts`

**Propósito:** Crea los permisos del módulo `roles-and-permissions` si no existen.

**Uso:**
```bash
npx ts-node scripts/create-roles-and-permissions-permissions.ts
```

**Funcionalidad:**
- Crea permisos: `create`, `read`, `update`, `delete` para el módulo `roles-and-permissions`
- Verifica existencia antes de crear
- Usa variables de entorno para conexión a BD

**Archivos relacionados:**
- `create-roles-and-permissions-permissions.sql` - Versión SQL

---

#### 2. `ensure-roles-and-permissions-permissions.ts`

**Propósito:** Versión mejorada que asegura que existan los permisos del módulo `roles-and-permissions`.

**Uso:**
```bash
npx ts-node scripts/ensure-roles-and-permissions-permissions.ts
```

**Funcionalidad:**
- Verifica y crea permisos faltantes
- Muestra mensajes de estado con emojis
- Cuenta permisos creados
- Manejo de errores mejorado

**Ventajas sobre `create-roles-and-permissions-permissions.ts`:**
- Mejor logging
- Manejo de errores más robusto
- Mensajes más informativos

---

#### 3. `fix-roles-unique-constraint.ts`

**Propósito:** Corrige la restricción única de `roles.name` para permitir soft delete.

**Uso:**
```bash
npx ts-node scripts/fix-roles-unique-constraint.ts
# O usando npm script:
npm run fix:roles-constraint
```

**Funcionalidad:**
1. Elimina índices únicos existentes: `IDX_ROLES_NAME`, `roles_name_key`
2. Encuentra y elimina restricciones únicas en la columna `name`
3. Crea índice único parcial: `IDX_ROLES_NAME_UNIQUE` WHERE `deleted_at IS NULL`

**Resultado:**
- Permite nombres duplicados si el rol anterior fue eliminado (soft delete)
- Mantiene unicidad para roles activos

**Archivos relacionados:**
- `fix-roles-unique-constraint.sql` - Versión SQL

---

#### 4. `get-database-info.ts` (Nuevo)

**Propósito:** Genera información completa de la base de datos en formato JSON.

**Uso:**
```bash
npx ts-node scripts/get-database-info.ts
```

**Salida:**
- Archivo: `backend-receptor/database-schema-info.json`
- Contiene: tablas, columnas, índices, foreign keys, constraints

---

## 📐 Patrones y Convenciones

### Soft Delete

**Patrón:** La mayoría de entidades principales usan soft delete mediante `deleted_at`.

**Tablas con soft delete:**
- `users`
- `roles`
- `areas`
- `departments`
- `devices`
- `device_signals`
- `torretas`
- `torreta_colors`
- `receptors`
- `emails`
- `measurements`
- `alert_rules`
- `dashboard_measurements`
- `dashboard_measurement_groups`
- `area_downtimes`
- `area_torreta_configs`
- `alert_escalation_configs`

**Beneficios:**
- Preserva historial
- Permite recuperación de datos
- Mantiene integridad referencial

---

### Timestamps Automáticos

**Patrón:** Todas las tablas principales tienen timestamps automáticos.

**Campos estándar:**
- `created_at` (timestamp with time zone, NOT NULL, default: now())
- `updated_at` (timestamp with time zone, NOT NULL, default: now())

**Excepciones:**
- `measurement_values` - Solo tiene `created_at` (datos históricos)
- `sessions` - Solo tiene `created_at` (no se actualiza)

---

### External IDs

**Patrón:** Entidades que se integran con sistemas externos tienen `external_id`.

**Tablas con external_id:**
- `measurements` (UNIQUE)
- `receptors` (UNIQUE)
- `torretas` (UNIQUE, nullable)
- `devices` (UNIQUE)
- `raw_measurements`
- `raw_signals`
- `processed_signals`

**Propósito:**
- Integración con sistemas externos
- Identificación sin depender del ID interno
- Sincronización de datos

---

### Enums

**Uso de Enums en PostgreSQL:**

1. **`MeasurementType`** (measurements.type)
   - `temperature`, `humidity`, `pressure`, `level`, `flow`, `vibration`

2. **`EventStatus`** (events.status)
   - `open`, `in-progress`, `closed`

3. **`AlertRuleMode`** (alert_rules.mode)
   - `setpoint`, `window`

4. **`ReceptorType`** (alert_messages.receptor_type)
   - `telegram`, `torreta`, `correo`, `receptor`

---

### JSONB para Datos Flexibles

**Uso:** `alert_messages.message_data` (jsonb)

**Estructura según tipo:**
```json
{
  "telegram": { "title": "...", "text": "..." },
  "torreta": { "torretaId": 1, "colorId": 2 },
  "correo": { "emails": [...], "subject": "...", "message": "..." },
  "receptor": { "receptorId": 1, "message": "..." }
}
```

**Ventajas:**
- Flexibilidad en estructura de datos
- Consultas JSONB nativas de PostgreSQL
- Sin necesidad de múltiples tablas

---

### Denormalización para Performance

**Ejemplo:** Tabla `events` almacena nombres denormalizados:
- `area_name`, `department_name`, `device_name`, `device_signal_name`

**Razón:**
- Evita JOINs en consultas frecuentes
- Mejora performance de lectura
- Los nombres cambian raramente

**Trade-off:**
- Requiere sincronización cuando cambian los nombres originales
- Aumenta tamaño de la tabla

---

## 🔐 Sistema de Permisos

### Arquitectura RBAC (Role-Based Access Control)

El sistema utiliza un modelo RBAC con tres niveles:

1. **Usuarios** (`users`)
2. **Roles** (`roles`)
3. **Permisos** (`permissions`)

### Estructura

```
User → UserRole → Role → RolePermission → Permission
```

### Módulos de Permisos

Los permisos están organizados por módulos:

| Módulo | Descripción | Entidades Relacionadas |
|--------|-------------|------------------------|
| `catalogs` | Catálogos unificados | areas, departments, torretas, torreta-colors, receptors, emails |
| `devices` | Dispositivos | devices, device_signals |
| `measurements` | Mediciones | measurements, measurement_values |
| `signals` | Señales | raw_signals, processed_signals |
| `raw-measurements` | Mediciones en crudo | raw_measurements |
| `message-groups` | Grupos de mensajes | message_groups |
| `measurement-alerts` | Alertas de mediciones | alert_rules, alert_messages |
| `alert-triggers` | Disparadores de alertas | alert_triggers |
| `area-downtime` | Tiempos de inactividad | area_downtimes, area_downtime_events |
| `area-torreta-config` | Configuración área-torreta | area_torreta_configs |
| `events` | Eventos | events |
| `users` | Usuarios | users, sessions |
| `dashboard` | Dashboard | dashboard_measurements, dashboard_measurement_groups |
| `roles-and-permissions` | Roles y permisos | roles, permissions, user_roles, role_permissions |

### Acciones

Cada módulo tiene 4 acciones estándar:
- `create` - Crear recursos
- `read` - Leer recursos
- `update` - Actualizar recursos
- `delete` - Eliminar recursos

### Formato de Permiso

Los permisos se identifican como: `{module}:{action}`

Ejemplos:
- `catalogs:create`
- `measurements:read`
- `roles-and-permissions:update`

### Creación de Permisos

Los permisos se crean automáticamente en la migración `1733000000000-CreateRolesAndPermissionsTables`.

Para asegurar que existan los permisos de `roles-and-permissions`:
```bash
npx ts-node scripts/ensure-roles-and-permissions-permissions.ts
```

---

## 📝 Notas Importantes

### Restricción Única de Roles

⚠️ **Importante:** La tabla `roles` tiene un índice único parcial en `name`:
```sql
CREATE UNIQUE INDEX "IDX_ROLES_NAME_UNIQUE" 
ON roles (name) 
WHERE deleted_at IS NULL;
```

Esto permite:
- Nombres únicos para roles activos
- Nombres duplicados si el rol anterior fue eliminado (soft delete)

Si necesitas corregir esta restricción:
```bash
npm run fix:roles-constraint
```

---

### Unificación de Módulos

El sistema ha evolucionado unificando módulos de permisos:

1. **Catálogos:** `areas`, `departments`, `torretas`, `torreta-colors`, `receptors`, `emails` → `catalogs`
2. **Alertas:** `alert-rules`, `alert-messages` → `measurement-alerts`
3. **Roles:** `roles`, `permissions` → `roles-and-permissions`

Las migraciones correspondientes migran automáticamente las referencias en `role_permissions`.

---

### Virtual Devices

Algunas entidades soportan "dispositivos virtuales":
- `devices.is_virtual_device` (boolean)
- `events.virtual_device` (boolean)
- `raw_measurements.virtual_device` (boolean)

Estos campos permiten distinguir entre dispositivos físicos y virtuales en el sistema.

---

### External IDs

Muchas entidades tienen `external_id` para integración con sistemas externos:
- Debe ser único cuando está marcado como UNIQUE
- Puede ser nullable en algunos casos (torretas)
- Se usa para sincronización con sistemas externos

---

## 🔍 Consultas Útiles

### Verificar Permisos de un Usuario

```sql
SELECT DISTINCT p.module, p.action
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.username = 'nombre_usuario'
ORDER BY p.module, p.action;
```

### Ver Roles de un Usuario

```sql
SELECT r.name, r.description
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'nombre_usuario'
AND r.deleted_at IS NULL;
```

### Ver Eventos Abiertos por Área

```sql
SELECT a.name, COUNT(*) as eventos_abiertos
FROM events e
JOIN areas a ON e.area_id = a.id
WHERE e.status = 'open'
AND a.deleted_at IS NULL
GROUP BY a.id, a.name
ORDER BY eventos_abiertos DESC;
```

### Ver Mediciones con Valores Recientes

```sql
SELECT m.name, m.type, mv.value, mv.created_at
FROM measurements m
JOIN measurement_values mv ON m.id = mv.measurement_id
WHERE mv.created_at > NOW() - INTERVAL '1 hour'
ORDER BY mv.created_at DESC;
```

---

## 📚 Referencias

### Archivos de Configuración

- `backend-receptor/ormconfig.ts` - Configuración de TypeORM para migraciones
- `backend-receptor/src/app.module.ts` - Configuración de TypeORM en NestJS
- `backend-receptor/env.example` - Variables de entorno de ejemplo

### Entidades TypeORM

Todas las entidades están en: `backend-receptor/src/{module}/domain/entities/`

### Migraciones

- **Migración activa:** `backend-receptor/src/migrations/1000000000000-InitialSchema.ts`
- **Migraciones archivadas:** `backend-receptor/src/migrations/archive/`
- **Guía de migraciones:** Ver [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### Scripts

Todos los scripts están en: `backend-receptor/scripts/`

---

## 🔄 Mantenimiento

### Ejecutar Migraciones

```bash
# Ver estado de migraciones
npm run migration:show

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Generar nueva migración
npm run migration:generate src/migrations/NombreMigracion
```

### Desarrollo vs Producción

**Desarrollo:**
- TypeORM usa `synchronize: true` en desarrollo
- Los cambios en entidades se sincronizan automáticamente
- No se requieren migraciones manuales durante desarrollo

**Producción:**
- Se usa `synchronize: false`
- Las migraciones se ejecutan automáticamente en Docker
- O manualmente con `npm run migration:run`

**Documentación:**
- Ver [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) para guía completa
- Ver [DEVELOPMENT.md](./DEVELOPMENT.md) para flujo de desarrollo
- Ver [MIGRATION_CONSOLIDATION.md](./MIGRATION_CONSOLIDATION.md) para detalles del proceso de consolidación

---

**Documento generado automáticamente**  
**Última actualización:** Ver fecha de generación del archivo `database-schema-info.json`


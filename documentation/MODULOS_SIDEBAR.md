# Módulos del Sidebar - Dashboard Test

## Lista de Módulos

### 1. 🚨 **Alertas** (`/dashboard/alerts`)

**Icono**: FaChartLine  
**Permiso**: `MEASUREMENT_ALERTS - READ`

Monitoreo y gestión de condiciones de alerta. Permite crear, editar y administrar reglas de alerta que se activan cuando las mediciones superan umbrales configurados. Incluye gestión de mensajes de alerta y configuración de escalación.

---

### 2. 📊 **Mediciones** (`/dashboard/measurements`)

**Icono**: FaGaugeHigh  
**Permiso**: `MEASUREMENTS - READ`

Dashboard de mediciones que permite visualizar y gestionar grupos de mediciones personalizados. Los usuarios pueden crear grupos, organizarlos y visualizarlos con gráficos en tiempo real.

---

### 3. 📡 **Señales** (`/dashboard/signals`)

**Icono**: PiWaveSineBold  
**Permiso**: Solo usuario ADMIN

Módulo avanzado para visualización de señales en tiempo real. Permite a los administradores monitorear las señales raw de los dispositivos para debugging y análisis técnico.

---

### 4. 🏭 **Dashboard Industrial** (`/dashboard/industrial`)

**Icono**: FaIndustry  
**Permiso**: Acceso general

Dashboard principal de producción industrial que muestra una vista general del estado de las líneas de producción. Visualiza áreas, eventos abiertos, en progreso y cerrados, con actualización en tiempo real mediante WebSocket.

---

### 5. ⏱️ **Tiempos de Paro** (`/dashboard/downtimes`)

**Icono**: FaClock  
**Permiso**: `AREA_DOWNTIME - READ`

Gestión y visualización de tiempos de paro de las áreas de producción. Permite registrar, consultar y analizar los períodos de inactividad de las líneas de producción.

---

### 6. 💻 **Dispositivos** (`/dashboard/devices`)

**Icono**: FaMicrochip  
**Permiso**: `DEVICES - READ`

Módulo completo de gestión de dispositivos IoT. Permite crear, editar, eliminar y gestionar dispositivos, así como asociar señales a cada dispositivo. Incluye búsqueda, filtrado y visualización en tabla.

---

### 7. 📚 **Catálogos** (`/dashboard/catalogs`)

**Icono**: FaDatabase  
**Permiso**: `CATALOGS - READ`

Módulo unificado para gestionar todos los catálogos del sistema mediante pestañas:

- **Áreas**: Gestión de áreas de producción
- **Departamentos**: Gestión de departamentos
- **Torretas**: Configuración de torretas
- **Colores de Torreta**: Gestión de colores para torretas
- **Receptores**: Gestión de receptores de señales
- **Correos**: Gestión de direcciones de correo para alertas

---

### 8. 👥 **Usuarios** (`/dashboard/users`)

**Icono**: FaUsers  
**Permiso**: `USERS - READ`

Gestión completa del catálogo de usuarios del sistema. Permite crear, editar, eliminar usuarios y asignar roles. Esencial para la administración de acceso al sistema.

---

### 9. 🛡️ **Roles y Permisos** (`/dashboard/roles`)

**Icono**: FaShieldHalved  
**Permiso**: `ROLES_AND_PERMISSIONS - READ`

Sistema de control de acceso basado en roles (RBAC). Permite gestionar roles, permisos y crear una matriz de permisos donde se pueden asignar permisos específicos (CREATE, READ, UPDATE, DELETE) por módulo a cada rol.

---

## Resumen

Total de módulos: **9**

- **Módulos de Monitoreo**: Alertas, Mediciones, Dashboard Industrial, Tiempos de Paro
- **Módulos de Gestión**: Dispositivos, Catálogos, Usuarios, Roles y Permisos
- **Módulo Técnico**: Señales (solo ADMIN)

Todos los módulos (excepto Dashboard Industrial y Señales) requieren permisos específicos para acceder, implementando un sistema de control de acceso granular.


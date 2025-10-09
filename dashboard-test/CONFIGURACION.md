# Configuración del Frontend - Track.IO

## Variables de Entorno

Este proyecto utiliza variables de entorno para configurar la conexión con el backend.

### Configuración Inicial

1. Crea un archivo `.env` en la raíz del proyecto `dashboard-test`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
```

2. Si estás desplegando en producción, actualiza la URL del backend según corresponda:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.tudominio.com
```

### Variables Disponibles

- `VITE_API_BASE_URL`: URL base del backend de Track.IO (por defecto: `http://localhost:3000`)

**Nota:** En Vite, todas las variables de entorno deben comenzar con el prefijo `VITE_` para ser expuestas al código del cliente.

## Nueva Funcionalidad: Consulta de Dispositivos de Medición

La página de señales en tiempo real (`/raw-signals`) ahora incluye la capacidad de consultar si una señal corresponde a un dispositivo de medición registrado en el backend.

### Características

1. **Consulta Automática**: Al seleccionar un registro de la lista, automáticamente se consulta el backend para verificar si existe un dispositivo de medición con ese `externalId`.

2. **Estados Visuales**:

   - **Cargando**: Muestra un spinner mientras se consulta el backend
   - **Encontrado**: Muestra toda la información del dispositivo con colores según el tipo
   - **No Encontrado**: Muestra un mensaje indicando que no existe el dispositivo

3. **Información Mostrada** (cuando existe el dispositivo):
   - ID del dispositivo
   - Nombre
   - Tipo (temperatura, humedad, presión, nivel, flujo, vibración)
   - External ID
   - Fecha de creación

### Tipos de Dispositivos

El sistema reconoce los siguientes tipos de dispositivos de medición:

- **Temperatura** (temperature) - Color rojo
- **Humedad** (humidity) - Color azul
- **Presión** (pressure) - Color amarillo
- **Nivel** (level) - Color gris
- **Flujo** (flow) - Color verde
- **Vibración** (vibration) - Color por defecto

## Estructura de Archivos Creados

```
dashboard-test/
├── .env                                          # Variables de entorno (crear manualmente)
├── src/
│   ├── lib/
│   │   ├── api.ts                               # Cliente de Axios configurado
│   │   └── services/
│   │       └── measurement.service.ts           # Servicio para consultar dispositivos
│   └── types/
│       └── measurement.ts                       # Tipos TypeScript para dispositivos
```

## Uso del Módulo de Axios

El módulo de axios está disponible globalmente y puede ser usado en cualquier parte del frontend:

```typescript
import apiClient from "@/lib/api";

// Ejemplo de uso
const response = await apiClient.get("/measurements");
const data = await apiClient.post("/measurements", { externalId: "TEMP_001" });
```

### Características del Cliente API

- **Base URL**: Se configura automáticamente desde las variables de entorno
- **Timeout**: 10 segundos por defecto
- **Headers**: Content-Type application/json por defecto
- **Interceptores**: Manejo de errores y logging automático

## Desarrollo Local

Para ejecutar el proyecto en modo desarrollo:

```bash
cd dashboard-test
pnpm dev
```

Asegúrate de que el backend esté corriendo en `http://localhost:3000` (o la URL que hayas configurado).

## Nueva Funcionalidad: Creación de Dispositivos de Medición desde la UI

### Flujo de Creación

Cuando un registro seleccionado **no tiene** un dispositivo de medición asociado:

1. Se muestra un mensaje: "¿Deseas agregar este dispositivo de medición?"
2. Un botón "Agregar Dispositivo" abre un modal
3. El modal contiene un formulario con:
   - **External ID**: Se muestra automáticamente (no editable)
   - **Nombre**: Campo de texto para el nombre descriptivo
   - **Tipo**: Select con las opciones de tipo de dispositivo

### Tipos de Dispositivos Disponibles

| Tipo        | Label en Español | Color       |
| ----------- | ---------------- | ----------- |
| temperature | Temperatura      | Rojo        |
| humidity    | Humedad          | Azul        |
| pressure    | Presión          | Amarillo    |
| level       | Nivel            | Gris        |
| flow        | Flujo            | Verde       |
| vibration   | Vibración        | Por defecto |

### Uso de la Funcionalidad

1. En la página de señales en tiempo real, selecciona un registro sin dispositivo asociado
2. Click en "Agregar Dispositivo"
3. En el modal:
   - Ingresa un nombre descriptivo (ej: "Sensor de Temperatura Principal")
   - Selecciona el tipo de dispositivo
   - Click en "Crear Dispositivo"
4. El dispositivo se crea y se muestra automáticamente en el panel de detalle

### Validaciones

- El nombre es **obligatorio** y no puede estar vacío
- El tipo es **obligatorio** y debe ser uno de los valores permitidos
- El external ID se toma automáticamente del registro seleccionado

### Componentes Creados

```
dashboard-test/src/components/organisms/
├── Modal.tsx                      # Componente modal reutilizable
└── CreateMeasurementForm.tsx      # Formulario de creación de dispositivos
```

## Próximos Pasos Recomendados

1. Agregar manejo de autenticación en los interceptores de axios
2. Implementar reintentos automáticos para peticiones fallidas
3. Agregar caché de consultas para dispositivos ya consultados
4. Implementar paginación para consultas de dispositivos
5. Agregar notificaciones toast para éxito/error en operaciones
6. Implementar validación de nombres duplicados

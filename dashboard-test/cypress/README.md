# Cypress E2E Tests

Este directorio contiene los tests end-to-end (E2E) usando Cypress para la aplicación.

## Estructura

```
cypress/
├── e2e/              # Tests E2E
│   └── devices/      # Tests específicos de DevicesPage
├── fixtures/         # Datos de prueba
├── support/          # Comandos personalizados y configuración
│   ├── commands.ts   # Comandos personalizados de Cypress
│   └── e2e.ts        # Configuración global
└── README.md         # Este archivo
```

## Instalación

Si Cypress no está instalado, ejecuta:

```bash
pnpm add -D cypress
```

## Uso

### Abrir Cypress en modo interactivo

```bash
pnpm run cypress:open
```

Esto abre la interfaz de Cypress donde puedes ejecutar los tests individualmente y verlos en tiempo real.

### Ejecutar todos los tests en modo headless

```bash
pnpm run cypress:run
```

### Ejecutar solo los tests de DevicesPage

```bash
pnpm run cypress:run:devices
# o
pnpm run test:e2e:devices
```

## Configuración

La configuración principal está en `cypress.config.ts` en la raíz del proyecto.

### Base URL

Por defecto, los tests apuntan a `http://localhost:5173` (puerto por defecto de Vite). Asegúrate de que tu aplicación esté corriendo en ese puerto o actualiza `baseUrl` en `cypress.config.ts`.

### Credenciales de Login

Los comandos personalizados usan credenciales por defecto. Puedes cambiarlas modificando el comando `cy.login()` en `cypress/support/commands.ts` o pasándolas como parámetros:

```typescript
cy.login("usuario@ejemplo.com", "password123");
```

## Comandos Personalizados

### `cy.login(email?, password?)`

Realiza login en la aplicación. Si no se proporcionan credenciales, usa valores por defecto.

```typescript
cy.login();
// o
cy.login("usuario@ejemplo.com", "password123");
```

### `cy.visitDevicesPage()`

Navega directamente a la página de dispositivos (requiere autenticación previa).

```typescript
cy.login();
cy.visitDevicesPage();
```

### `cy.waitForDevicesTable()`

Espera a que la tabla de dispositivos esté completamente cargada.

```typescript
cy.visitDevicesPage();
cy.waitForDevicesTable();
```

## Tests de DevicesPage

Los tests están ubicados en `cypress/e2e/devices/DevicesPage.cy.ts` y cubren:

1. **Renderizado Básico**: Verificación de que la página se renderiza correctamente
2. **Visualización de Datos**: Verificación de la tabla y sus datos
3. **Creación de Dispositivo**: Apertura y cierre del modal de creación
4. **Edición de Dispositivo**: Apertura del modal de edición
5. **Eliminación de Dispositivo**: Apertura del modal de confirmación
6. **Gestión de Señales**: Agregar, editar y eliminar señales, configurar escalamientos
7. **Estados de Carga y Error**: Verificación de estados de loading y errores

## Selectores Recomendados

Para mejorar la estabilidad de los tests, se recomienda agregar atributos `data-cy` a los componentes clave:

- `data-cy="devices-table"` - Tabla de dispositivos
- `data-cy="add-device-button"` - Botón de agregar dispositivo
- `data-cy="edit-device-button"` - Botón de editar dispositivo
- `data-cy="delete-device-button"` - Botón de eliminar dispositivo
- `data-cy="create-device-modal"` - Modal de creación
- `data-cy="edit-device-modal"` - Modal de edición
- `data-cy="delete-device-modal"` - Modal de eliminación
- `data-cy="add-signal-button"` - Botón de agregar señal
- `data-cy="edit-signal-button"` - Botón de editar señal
- `data-cy="close-modal"` - Botón de cerrar modal
- `data-cy="expand-row"` - Botón para expandir fila

## Debugging

### Ver screenshots en caso de fallo

Los screenshots se guardan automáticamente en `cypress/screenshots/` cuando un test falla.

### Ver videos de los tests

Para habilitar videos, cambia `video: false` a `video: true` en `cypress.config.ts`. Los videos se guardan en `cypress/videos/`.

### Modo interactivo

Usa `npm run cypress:open` para ejecutar tests de forma interactiva y poder hacer debugging paso a paso.

## Próximos Pasos

1. Agregar atributos `data-cy` a los componentes para selectores más estables
2. Expandir la cobertura de tests
3. Configurar intercepción de APIs para tests más controlados
4. Integrar en CI/CD pipeline

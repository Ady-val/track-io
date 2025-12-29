# Testing E2E con Cypress

Guía completa y simplificada para ejecutar tests end-to-end con Cypress en Track.IO.

## 🚀 Inicio Rápido

### Paso 1: Iniciar el entorno de testing

```bash
cd dashboard-test
pnpm run test:env:start
```

Este comando:

- Inicia PostgreSQL en el puerto **5433** (base de datos `track_io_test`)
- Inicia el Backend en el puerto **3001**
- **Crea automáticamente el usuario ADMIN** al iniciar el backend (tarda ~10 segundos)

**Credenciales del usuario ADMIN:**

- Username: `ADMIN`
- Password: `Admin123!`

### Paso 2: Iniciar el frontend (en otra terminal)

```bash
cd dashboard-test
pnpm run dev:test
```

Este comando inicia Vite en `http://localhost:5173` apuntando al backend de testing en `http://localhost:3001`.

### Paso 3: Ejecutar Cypress

```bash
# Modo interactivo (recomendado para desarrollo)
pnpm run cypress:open

# Modo headless (para CI/CD)
pnpm run test:e2e:devices
```

## 📋 Comandos Disponibles

| Comando                     | Descripción                                        |
| --------------------------- | -------------------------------------------------- |
| `pnpm run test:env:start`   | Inicia PostgreSQL y Backend de testing             |
| `pnpm run test:env:stop`    | Detiene el entorno de testing                      |
| `pnpm run dev:test`         | Inicia el frontend apuntando al backend de testing |
| `pnpm run cypress:open`     | Abre Cypress en modo interactivo                   |
| `pnpm run test:e2e:devices` | Ejecuta tests de DevicesPage en modo headless      |

## 🔧 Configuración

### Puertos

- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:3001`
- **PostgreSQL**: `localhost:5433`

### Base de Datos

- **Nombre**: `track_io_test`
- **Usuario**: `postgres_test`
- **Password**: `postgres_test`

El esquema se sincroniza automáticamente al iniciar el backend en modo test.

### Usuario de Prueba

El backend crea automáticamente un usuario ADMIN al iniciar en modo test:

- **Username**: `ADMIN`
- **Password**: `Admin123!`
- **Permisos**: Administrador completo (todos los permisos)

Este usuario se crea automáticamente después de que el backend sincroniza el esquema (~10 segundos después del inicio).

## 📁 Estructura de Tests

Los tests de Cypress se encuentran en:

```
dashboard-test/
├── cypress/
│   ├── e2e/
│   │   └── devices/
│   │       └── DevicesPage.cy.ts    # Tests de la página de dispositivos
│   ├── fixtures/
│   │   └── devices.json             # Datos de prueba
│   └── support/
│       ├── commands.ts              # Comandos personalizados (cy.login, etc.)
│       └── e2e.ts                   # Configuración global
└── cypress.config.ts                # Configuración de Cypress
```

## 🎯 Selectores de Tests

Los tests utilizan atributos `data-cy` para identificar elementos de forma estable:

- `data-cy="username-input"` - Campo de usuario en login
- `data-cy="password-input"` - Campo de contraseña en login
- `data-cy="login-submit-button"` - Botón de login
- `data-cy="devices-table"` - Tabla de dispositivos
- `data-cy="add-device-button"` - Botón para agregar dispositivo
- `data-cy="create-device-modal"` - Modal de crear dispositivo
- Y muchos más...

Ver `cypress/e2e/devices/DevicesPage.cy.ts` para todos los selectores utilizados.

## 🆘 Solución de Problemas

### El backend no inicia

**Síntoma**: Error al iniciar `test:env:start`

**Solución**:

1. Verifica que Docker esté corriendo
2. Verifica que los puertos 3001 y 5433 no estén ocupados
3. Detén contenedores anteriores: `pnpm run test:env:stop`

### Error "Network error" al hacer login en Cypress

**Síntoma**: Los tests fallan con error de red al hacer login

**Solución**:

1. Verifica que el backend esté corriendo: `curl http://localhost:3001`
2. Verifica que el frontend esté corriendo en `http://localhost:5173`
3. Asegúrate de haber ejecutado `pnpm run dev:test` (no solo `pnpm run dev`)

### El usuario ADMIN no existe

**Síntoma**: Error de credenciales inválidas

**Solución**:

1. Espera ~10 segundos después de iniciar el entorno para que el seed se ejecute
2. Verifica los logs del backend: `docker logs track_io_backend_test | grep "Usuario ADMIN"`
3. El seed se ejecuta automáticamente al iniciar el backend en modo test

### Los tests no encuentran elementos

**Síntoma**: Cypress no encuentra elementos con `data-cy`

**Solución**:

1. Verifica que los componentes tengan los atributos `data-cy` correctos
2. Asegúrate de haber hecho login antes de buscar elementos protegidos
3. Revisa que el frontend esté en la página correcta

## 🔍 Verificación del Entorno

Para verificar que todo está funcionando:

```bash
# 1. Verificar que los contenedores estén corriendo
docker ps | grep track_io.*test

# Deberías ver:
# - track_io_postgres_test (puerto 5433)
# - track_io_backend_test (puerto 3001)

# 2. Verificar que el backend responda
curl http://localhost:3001

# 3. Verificar que el usuario ADMIN exista (desde el contenedor)
docker exec -it track_io_postgres_test psql -U postgres_test -d track_io_test -c "SELECT username, name FROM users WHERE username = 'ADMIN';"
```

## 📝 Notas Importantes

1. **Entorno Aislado**: El entorno de testing usa puertos y bases de datos separados, por lo que no interfiere con desarrollo o producción.

2. **Seed Automático**: El usuario ADMIN se crea automáticamente al iniciar el backend. No necesitas ejecutar comandos adicionales.

3. **Sincronización de Schema**: En modo test, TypeORM sincroniza el esquema automáticamente (`TYPEORM_SYNCHRONIZE=true`).

4. **Data-cy Attributes**: Todos los elementos interactuables tienen atributos `data-cy` para facilitar los tests.

5. **Comandos Personalizados**: Cypress tiene comandos personalizados como `cy.login()` para facilitar los tests. Ver `cypress/support/commands.ts`.

## 🧹 Limpieza

Para limpiar completamente el entorno (eliminar volúmenes de Docker):

```bash
cd docker
docker-compose -f docker-compose.test.yml down -v
```

Esto eliminará todos los datos de la base de datos de testing.

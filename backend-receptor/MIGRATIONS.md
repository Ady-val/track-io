# TypeORM Migrations Guide

Este proyecto utiliza TypeORM para manejar las migraciones de base de datos. Las migraciones permiten versionar y sincronizar cambios en el esquema de la base de datos de manera controlada.

## Configuración

Las migraciones están configuradas en el archivo `ormconfig.ts` y los scripts están disponibles en `package.json`.

### Requisitos Previos

1. **Base de datos PostgreSQL**: Asegúrate de que PostgreSQL esté ejecutándose
2. **Variables de entorno**: Copia `env.example` a `.env` y configura tus credenciales de base de datos
3. **Base de datos creada**: Crea la base de datos `track_io` en PostgreSQL

### Configuración de Base de Datos

```bash
# Copiar archivo de configuración
cp env.example .env

# Editar variables de entorno según tu configuración
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_USERNAME=postgres
# DATABASE_PASSWORD=postgres
# DATABASE_NAME=track_io
```

## Scripts Disponibles

### Comandos de Migración

```bash
# Generar una nueva migración basada en cambios en las entidades
npm run migration:generate -- src/migrations/MigrationName

# Crear una migración vacía
npm run migration:create -- src/migrations/MigrationName

# Ejecutar todas las migraciones pendientes
npm run migration:run

# Revertir la última migración
npm run migration:revert

# Mostrar el estado de las migraciones
npm run migration:show
```

### Comandos de Esquema

```bash
# Sincronizar el esquema con las entidades (solo desarrollo)
npm run schema:sync

# Eliminar todo el esquema de la base de datos
npm run schema:drop
```

## Migraciones Creadas

### 1. CreateAreasTable (1704067200000)

- **Tabla**: `areas`
- **Campos**: id, name, created_at, updated_at, deleted_at
- **Índices**: created_at, deleted_at

### 2. CreateDepartmentsTable (1704067260000)

- **Tabla**: `departments`
- **Campos**: id, name, created_at, updated_at, deleted_at
- **Índices**: created_at, deleted_at

### 3. CreateDevicesTable (1704067320000)

- **Tabla**: `devices`
- **Campos**: id, name, area_id, external_id, created_at, updated_at, deleted_at
- **Relaciones**: Foreign Key a `areas.id`
- **Índices**: external_id, area_id, created_at, deleted_at

## Uso en Desarrollo

1. **Ejecutar migraciones**:

   ```bash
   npm run migration:run
   ```

2. **Verificar estado**:

   ```bash
   npm run migration:show
   ```

3. **Revertir cambios si es necesario**:
   ```bash
   npm run migration:revert
   ```

## Uso en Producción

⚠️ **IMPORTANTE**: En producción, siempre:

1. Hacer backup de la base de datos antes de ejecutar migraciones
2. Probar las migraciones en un entorno de staging
3. Ejecutar migraciones durante ventanas de mantenimiento
4. Monitorear el proceso de migración

```bash
# En producción
npm run migration:run
```

## Convenciones

- Los nombres de migraciones deben ser descriptivos y seguir el formato: `YYYYMMDDHHMMSS-DescriptiveName`
- Las migraciones deben ser reversibles (implementar tanto `up` como `down`)
- Usar timestamps únicos para evitar conflictos
- Documentar cambios importantes en el código de migración

## Estructura de Archivos

```
src/
├── migrations/
│   ├── 1704067200000-CreateAreasTable.ts
│   ├── 1704067260000-CreateDepartmentsTable.ts
│   └── 1704067320000-CreateDevicesTable.ts
└── ...
```

## Troubleshooting

### Error: "Migration already exists"

Si una migración ya existe, puedes:

- Eliminar la migración duplicada
- Cambiar el timestamp en el nombre del archivo

### Error: "Foreign key constraint fails"

Verifica que las tablas referenciadas existan antes de crear foreign keys.

### Error: "Table already exists"

Esto puede ocurrir si `synchronize: true` está habilitado. Desactívalo en producción y usa solo migraciones.

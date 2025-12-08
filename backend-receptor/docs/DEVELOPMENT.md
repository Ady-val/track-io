# Guía de Desarrollo - Track.IO Backend

## Configuración del Entorno de Desarrollo

### Requisitos Previos

- Node.js 18+
- pnpm (package manager)
- Docker (para base de datos PostgreSQL)
- PostgreSQL 15 (opcional, si no usas Docker)

### Configuración Inicial

1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp env.example .env
   # Editar .env con tus configuraciones
   ```

3. **Iniciar base de datos (Docker):**
   ```bash
   cd ../docker
   docker-compose up -d postgres
   ```

4. **Iniciar backend en modo desarrollo:**
   ```bash
   cd backend-receptor
   pnpm run start:dev
   ```

## Flujo de Desarrollo con TypeORM Synchronize

### Cómo Funciona

En desarrollo, TypeORM usa `synchronize: true` que:
- Sincroniza automáticamente las entidades con la base de datos
- Crea/modifica tablas según los cambios en las entidades
- **NO requiere migraciones manuales durante desarrollo**

### Ventajas

- ✅ Desarrollo rápido e iterativo
- ✅ Cambios inmediatos sin crear migraciones
- ✅ Ideal para prototipado y pruebas

### Desventajas

- ⚠️ Puede perder datos si eliminas columnas
- ⚠️ No hay historial de cambios
- ⚠️ No debe usarse en producción

### Flujo Típico

1. **Modificar una entidad:**
   ```typescript
   // src/users/domain/entities/user.entity.ts
   @Column({ type: 'varchar', length: 255, nullable: true })
   phoneNumber?: string;
   ```

2. **Reiniciar el servidor:**
   - TypeORM detecta el cambio
   - Sincroniza automáticamente la base de datos
   - La nueva columna se crea

3. **Probar el cambio:**
   - Usar la nueva columna en el código
   - Verificar que funciona correctamente

## Antes de Commit

### Checklist

- [ ] Código funciona correctamente
- [ ] Tests pasan (si existen)
- [ ] Linter sin errores: `npm run lint:check`
- [ ] Formato correcto: `npm run format:check`

### Si Cambiaste Entidades

Si modificaste entidades durante el desarrollo:

1. **Evaluar si necesitas migración:**
   - Cambios menores: Crear nueva migración
   - Cambios mayores: Considerar actualizar migración inicial

2. **Crear migración (si es necesario):**
   ```bash
   npm run migration:generate -- src/migrations/DescripcionDelCambio
   ```

3. **Revisar la migración:**
   - Verificar que el SQL es correcto
   - Asegurar que no hay pérdida de datos

## Regenerar Migración Inicial

Si realizaste cambios significativos en múltiples entidades, puedes necesitar actualizar la migración inicial:

### Cuándo Regenerar

- Cambios en muchas entidades a la vez
- Cambios en la estructura fundamental
- Cambios en datos iniciales (permissions, message_groups, torreta_colors)

### Cómo Regenerar

1. **Revisar todos los cambios:**
   - Comparar entidades actuales con la migración inicial
   - Identificar todas las diferencias

2. **Actualizar manualmente:**
   - Editar `src/migrations/1000000000000-InitialSchema.ts`
   - Asegurar orden correcto de creación
   - Incluir todos los datos iniciales

3. **Probar en base de datos limpia:**
   ```bash
   # Crear base de datos temporal
   createdb track_io_test
   
   # Ejecutar migración
   npm run migration:run
   
   # Verificar que todo se creó correctamente
   ```

## Crear Nuevas Migraciones

Para cambios incrementales después del desarrollo:

### Proceso

1. **Desarrollo con synchronize:**
   - Modificar entidades
   - TypeORM sincroniza automáticamente
   - Probar cambios

2. **Generar migración:**
   ```bash
   npm run migration:generate -- src/migrations/AddNewFeature
   ```

3. **Revisar migración generada:**
   - Verificar SQL generado
   - Asegurar que es correcto
   - Agregar verificaciones si es necesario

4. **Commit:**
   - Incluir migración en el commit
   - Documentar cambios si es necesario

## Comandos Útiles

### Desarrollo
```bash
# Iniciar en modo desarrollo (con hot reload)
pnpm run start:dev

# Iniciar en modo debug
pnpm run start:debug

# Ver logs de TypeORM
# (activar logging en ormconfig.ts)
```

### Migraciones
```bash
# Ver estado de migraciones
npm run migration:show

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Crear nueva migración
npm run migration:generate -- src/migrations/Nombre

# Resetear migraciones (solo desarrollo)
npm run migration:reset
```

### Base de Datos
```bash
# Conectar a PostgreSQL
psql -U postgres -d track_io

# Ver todas las tablas
\dt

# Ver estructura de una tabla
\d nombre_tabla

# Ver índices
\di
```

## Estructura del Proyecto

```
backend-receptor/
├── src/
│   ├── **/*.entity.ts          # Entidades TypeORM (fuente de verdad)
│   └── migrations/
│       └── 1000000000000-InitialSchema.ts  # Migración inicial única
├── scripts/
│   ├── generate-initial-migration.ts  # Script de referencia
│   └── start-with-migrations.sh       # Script para Docker
├── .env                          # Variables de entorno (no commitear)
└── package.json                  # Scripts npm
```

## Troubleshooting

### TypeORM no sincroniza cambios

1. Verificar que `NODE_ENV=development` en `.env`
2. Verificar que `synchronize: true` en `app.module.ts`
3. Reiniciar el servidor

### Error: "Table already exists"

- La tabla ya existe en la base de datos
- Opciones:
  - Eliminar la tabla manualmente
  - Usar `synchronize: false` temporalmente
  - Crear migración para el cambio

### Error: "Cannot connect to database"

1. Verificar que PostgreSQL está corriendo
2. Verificar variables de entorno en `.env`
3. Verificar que el puerto 5432 está disponible
4. Verificar credenciales

### Perdí datos al modificar entidades

- `synchronize: true` puede eliminar columnas si las quitas de la entidad
- **Siempre hacer backup antes de cambios importantes**
- Considerar usar migraciones para cambios que puedan perder datos

## Mejores Prácticas

1. **Hacer commits frecuentes:**
   - Commit después de cada cambio funcional
   - Incluir migraciones si las creaste

2. **Probar cambios localmente:**
   - Verificar que todo funciona antes de commit
   - Probar con datos reales si es posible

3. **Documentar cambios importantes:**
   - Comentar en código si es necesario
   - Actualizar documentación si cambias comportamiento

4. **Mantener entidades sincronizadas:**
   - Las entidades son la fuente de verdad
   - Mantenerlas actualizadas con el esquema real

5. **Usar migraciones para producción:**
   - Nunca usar `synchronize: true` en producción
   - Siempre crear migraciones para cambios

## Referencias

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS Documentation](https://docs.nestjs.com/)
- `MIGRATION_GUIDE.md` - Guía completa de migraciones
- `DATABASE_SCHEMA.md` - Documentación del esquema de base de datos


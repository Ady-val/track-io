# Guía de Migraciones - Track.IO

## Sistema de Migraciones

El sistema de migraciones de Track.IO utiliza TypeORM para gestionar cambios en el esquema de la base de datos.

### Estructura Actual

- **Migración Inicial:** `1000000000000-InitialSchema.ts`
  - Contiene todo el esquema inicial de la base de datos
  - Incluye datos iniciales críticos (permissions, message_groups, torreta_colors)
  - Todas las migraciones anteriores fueron consolidadas en esta

- **Migraciones Futuras:** Se crearán nuevas migraciones para cambios incrementales

## Flujo de Trabajo

### Desarrollo Local

En desarrollo, TypeORM usa `synchronize: true` para sincronizar automáticamente las entidades con la base de datos:

```typescript
// app.module.ts
synchronize: configService.get<string>('NODE_ENV') === 'development'
```

**Flujo:**
1. Modificar entidades en `src/**/*.entity.ts`
2. Ejecutar `pnpm run start:dev`
3. TypeORM sincroniza automáticamente los cambios
4. Probar cambios localmente

### Producción

En producción, se usan migraciones para aplicar cambios de forma controlada:

1. **Crear nueva migración:**
   ```bash
   npm run migration:generate -- src/migrations/NombreDelCambio
   ```

2. **Revisar la migración generada:**
   - Verificar que el SQL generado es correcto
   - Asegurar que no hay pérdida de datos
   - Probar en entorno de staging primero

3. **Aplicar migración:**
   ```bash
   npm run migration:run
   ```

4. **En Docker (producción):**
   - Las migraciones se ejecutan automáticamente al iniciar el contenedor
   - El script `start-with-migrations.sh` ejecuta migraciones antes de iniciar la app

## Comandos Disponibles

### Ver Estado de Migraciones
```bash
npm run migration:show
```

### Ejecutar Migraciones Pendientes
```bash
npm run migration:run
```

### Revertir Última Migración
```bash
npm run migration:revert
```

### Crear Nueva Migración
```bash
npm run migration:generate -- src/migrations/NombreDelCambio
```

### Crear Migración Vacía (para escribir manualmente)
```bash
npm run migration:create -- src/migrations/NombreDelCambio
```

### Resetear Migraciones (Desarrollo)
```bash
npm run migration:reset
```

## Cuándo Regenerar la Migración Inicial

La migración inicial (`1000000000000-InitialSchema.ts`) debe regenerarse manualmente cuando:

1. **Cambios significativos en múltiples entidades:**
   - Si cambias muchas entidades a la vez
   - Si cambias la estructura fundamental del esquema

2. **Cambios en datos iniciales:**
   - Si necesitas agregar/modificar datos iniciales en permissions, message_groups o torreta_colors

3. **Antes de un deploy importante:**
   - Para asegurar que la migración inicial refleja el estado actual

**Proceso para regenerar:**
1. Revisar todos los cambios en entidades
2. Actualizar manualmente `1000000000000-InitialSchema.ts`
3. Asegurar que incluye todos los datos iniciales necesarios
4. Probar en base de datos limpia

## Crear Nuevas Migraciones

Para cambios incrementales, crea nuevas migraciones:

### Ejemplo: Agregar una nueva columna

1. **Modificar la entidad:**
   ```typescript
   // src/users/domain/entities/user.entity.ts
   @Column({ type: 'varchar', length: 255, nullable: true })
   phoneNumber?: string;
   ```

2. **En desarrollo:**
   - TypeORM sincroniza automáticamente
   - Probar que funciona

3. **Antes de deploy:**
   ```bash
   npm run migration:generate -- src/migrations/AddPhoneNumberToUsers
   ```

4. **Revisar la migración generada:**
   ```typescript
   // Debe incluir ALTER TABLE users ADD COLUMN phone_number...
   ```

5. **Aplicar en producción:**
   - La migración se ejecutará automáticamente en Docker
   - O manualmente: `npm run migration:run`

## Buenas Prácticas

### 1. Siempre Probar Migraciones
- Probar en base de datos de desarrollo primero
- Verificar que no hay pérdida de datos
- Probar el rollback con `migration:revert`

### 2. Migraciones Idempotentes
- Usar `IF NOT EXISTS` o `ON CONFLICT DO NOTHING` cuando sea posible
- Verificar existencia antes de crear/eliminar

### 3. Datos Iniciales
- Solo incluir datos críticos en la migración inicial
- Datos opcionales deben crearse manualmente o con seeders

### 4. Orden de Operaciones
- Crear tablas antes de foreign keys
- Crear enums antes de usarlos
- Eliminar foreign keys antes de eliminar tablas (en down)

### 5. Backup
- Siempre hacer backup antes de aplicar migraciones en producción
- Tener un plan de rollback

## Datos Iniciales Críticos

La migración inicial incluye estos datos que son **obligatorios** para el funcionamiento del sistema:

### permissions
- 56 permisos (14 módulos × 4 acciones)
- CRÍTICO para el sistema RBAC

### message_groups
- 5 grupos de mensajes
- CRÍTICO para el sistema de alertas

### torreta_colors
- 8 colores de torretas
- IMPORTANTE para el sistema de torretas

## Troubleshooting

### Error: "Migration already executed"
- La migración ya fue aplicada
- Verificar con `npm run migration:show`

### Error: "Table already exists"
- La tabla ya existe en la base de datos
- Verificar estado de la base de datos
- Considerar usar `IF NOT EXISTS` en la migración

### Error: "Foreign key constraint fails"
- Verificar orden de creación de tablas
- Asegurar que las tablas referenciadas existen

### Error en Docker: "Cannot connect to database"
- Verificar que PostgreSQL está saludable
- Verificar variables de entorno
- Verificar que `depends_on` está configurado correctamente

## Referencias

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- `DATABASE_SCHEMA.md` - Documentación completa del esquema
- `MIGRATION_CONSOLIDATION.md` - Documentación del proceso de consolidación


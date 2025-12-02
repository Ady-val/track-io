-- Script para cambiar la restricción única de roles.name
-- Permite nombres duplicados si el rol anterior fue eliminado (soft delete)

-- Eliminar índices únicos existentes
DROP INDEX IF EXISTS "IDX_ROLES_NAME";
DROP INDEX IF EXISTS "roles_name_key";

-- Eliminar restricciones únicas existentes en la columna name
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'roles'::regclass 
        AND contype = 'u'
        AND conkey::text LIKE '%name%'
    LOOP
        EXECUTE format('ALTER TABLE roles DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

-- Crear índice único parcial que solo considera roles no eliminados
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ROLES_NAME_UNIQUE" 
ON roles (name) 
WHERE deleted_at IS NULL;





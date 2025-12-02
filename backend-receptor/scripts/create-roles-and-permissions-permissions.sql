-- Script para crear los permisos de roles-and-permissions si no existen
-- Esto corrige el problema donde la migración de unificación eliminó los permisos antiguos
-- pero los nuevos permisos de roles-and-permissions no existían

INSERT INTO permissions (module, action, description, created_at, updated_at)
SELECT 'roles-and-permissions', 'create', 'Permission to create roles-and-permissions', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions 
  WHERE module = 'roles-and-permissions' AND action = 'create'
);

INSERT INTO permissions (module, action, description, created_at, updated_at)
SELECT 'roles-and-permissions', 'read', 'Permission to read roles-and-permissions', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions 
  WHERE module = 'roles-and-permissions' AND action = 'read'
);

INSERT INTO permissions (module, action, description, created_at, updated_at)
SELECT 'roles-and-permissions', 'update', 'Permission to update roles-and-permissions', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions 
  WHERE module = 'roles-and-permissions' AND action = 'update'
);

INSERT INTO permissions (module, action, description, created_at, updated_at)
SELECT 'roles-and-permissions', 'delete', 'Permission to delete roles-and-permissions', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM permissions 
  WHERE module = 'roles-and-permissions' AND action = 'delete'
);


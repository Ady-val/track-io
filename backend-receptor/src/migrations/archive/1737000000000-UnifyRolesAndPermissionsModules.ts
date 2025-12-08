import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifyRolesAndPermissionsModules1737000000000
  implements MigrationInterface
{
  name = 'UnifyRolesAndPermissionsModules1737000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'permissions'
      );
    `);

    if (!tableExists[0]?.exists) {
      return;
    }

    const hasOldModules = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM permissions
      WHERE module IN ('roles', 'permissions');
    `);

    if (parseInt(hasOldModules[0]?.count || '0') === 0) {
      return;
    }

    // Primero, actualizar las referencias en role_permissions antes de eliminar
    const rolePermissionsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'role_permissions'
      );
    `);

    // Primero, crear los permisos de roles-and-permissions si no existen
    const actions = ['create', 'read', 'update', 'delete'];
    for (const action of actions) {
      const existing = await queryRunner.query(`
        SELECT id FROM permissions
        WHERE module = 'roles-and-permissions' AND action = '${action}'
      `);

      if (existing.length === 0) {
        // Crear el permiso desde uno de los módulos antiguos si existe, o crear uno nuevo
        const oldPermission = await queryRunner.query(`
          SELECT description, created_at, updated_at FROM permissions
          WHERE module IN ('roles', 'permissions') AND action = '${action}'
          LIMIT 1
        `);

        const description =
          oldPermission.length > 0
            ? oldPermission[0].description ||
              `Permission to ${action} roles-and-permissions`
            : `Permission to ${action} roles-and-permissions`;
        const createdAt =
          oldPermission.length > 0
            ? oldPermission[0].created_at
            : new Date().toISOString();
        const updatedAt =
          oldPermission.length > 0
            ? oldPermission[0].updated_at
            : new Date().toISOString();

        await queryRunner.query(`
          INSERT INTO permissions (module, action, description, created_at, updated_at)
          VALUES ('roles-and-permissions', '${action}', '${description.replace(/'/g, "''")}', '${createdAt}', '${updatedAt}')
        `);
      }
    }

    if (rolePermissionsExists[0]?.exists) {
      // Actualizar role_permissions para que apunten a los permisos de roles-and-permissions existentes
      await queryRunner.query(`
        UPDATE role_permissions rp
        SET permission_id = (
          SELECT p2.id
          FROM permissions p2
          WHERE p2.module = 'roles-and-permissions'
            AND p2.action = (
              SELECT p1.action
              FROM permissions p1
              WHERE p1.id = rp.permission_id
                AND p1.module IN ('roles', 'permissions')
            )
          LIMIT 1
        )
        WHERE rp.permission_id IN (
          SELECT id
          FROM permissions
          WHERE module IN ('roles', 'permissions')
        )
        AND EXISTS (
          SELECT 1
          FROM permissions p2
          WHERE p2.module = 'roles-and-permissions'
            AND p2.action = (
              SELECT p1.action
              FROM permissions p1
              WHERE p1.id = rp.permission_id
            )
        );
      `);
    }

    // Eliminar los permisos antiguos (roles y permissions)
    // ya que roles-and-permissions ya existe con los mismos permisos
    await queryRunner.query(`
      DELETE FROM permissions
      WHERE module IN ('roles', 'permissions');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const actions = ['create', 'read', 'update', 'delete'];

    for (const action of actions) {
      await queryRunner.query(`
        INSERT INTO permissions (module, action, description, created_at, updated_at)
        SELECT 'roles', '${action}', description, created_at, updated_at
        FROM permissions
        WHERE module = 'roles-and-permissions' AND action = '${action}'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      `);

      await queryRunner.query(`
        INSERT INTO permissions (module, action, description, created_at, updated_at)
        SELECT 'permissions', '${action}', description, created_at, updated_at
        FROM permissions
        WHERE module = 'roles-and-permissions' AND action = '${action}'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      `);
    }

    await queryRunner.query(`
      UPDATE role_permissions rp
      SET permission_id = (
        SELECT p2.id
        FROM permissions p2
        WHERE p2.module = 'roles'
          AND p2.action = (
            SELECT p1.action
            FROM permissions p1
            WHERE p1.id = rp.permission_id
          )
        LIMIT 1
      )
      WHERE rp.permission_id IN (
        SELECT id
        FROM permissions
        WHERE module = 'roles-and-permissions'
      );
    `);
  }
}

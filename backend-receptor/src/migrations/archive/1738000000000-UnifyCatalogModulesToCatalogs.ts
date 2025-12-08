import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifyCatalogModulesToCatalogs1738000000000
  implements MigrationInterface
{
  name = 'UnifyCatalogModulesToCatalogs1738000000000';

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
      WHERE module IN ('areas', 'departments', 'torretas', 'torreta-colors', 'receptors', 'emails');
    `);

    if (parseInt(hasOldModules[0]?.count || '0') === 0) {
      return;
    }

    // Primero, crear los permisos de catalogs si no existen
    const actions = ['create', 'read', 'update', 'delete'];
    for (const action of actions) {
      const existingPermissions = await queryRunner.query(
        `
        SELECT id FROM permissions
        WHERE module = 'catalogs' AND action = $1
      `,
        [action]
      );

      if (existingPermissions.length === 0) {
        // Crear el permiso desde uno de los módulos antiguos si existe, o crear uno nuevo
        const oldPermission = await queryRunner.query(
          `
          SELECT description, created_at, updated_at FROM permissions
          WHERE module IN ('areas', 'departments', 'torretas', 'torreta-colors', 'receptors', 'emails') 
            AND action = $1
          LIMIT 1
        `,
          [action]
        );

        const description =
          oldPermission.length > 0
            ? oldPermission[0].description
            : `Permission to ${action} catalogs`;
        const createdAt =
          oldPermission.length > 0 ? oldPermission[0].created_at : new Date();
        const updatedAt =
          oldPermission.length > 0 ? oldPermission[0].updated_at : new Date();

        await queryRunner.query(
          `
          INSERT INTO permissions (module, action, description, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
        `,
          ['catalogs', action, description, createdAt, updatedAt]
        );
      }
    }

    const rolePermissionsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'role_permissions'
      );
    `);

    if (rolePermissionsExists[0]?.exists) {
      // Para cada acción, primero eliminar duplicados: si un rol ya tiene un permiso de catalogs,
      // eliminar los permisos antiguos de los módulos individuales para esa misma acción
      for (const action of actions) {
        await queryRunner.query(
          `
          DELETE FROM role_permissions rp1
          WHERE rp1.permission_id IN (
            SELECT p1.id
            FROM permissions p1
            WHERE p1.module IN ('areas', 'departments', 'torretas', 'torreta-colors', 'receptors', 'emails')
              AND p1.action = $1
          )
          AND EXISTS (
            SELECT 1
            FROM role_permissions rp2
            INNER JOIN permissions p2 ON rp2.permission_id = p2.id
            WHERE rp2.role_id = rp1.role_id
              AND p2.module = 'catalogs'
              AND p2.action = $1
          );
        `,
          [action]
        );
      }

      // Obtener el ID del permiso de catalogs para cada acción
      const catalogPermissionIds: Record<string, number> = {};
      for (const action of actions) {
        const result = await queryRunner.query(
          `
          SELECT id FROM permissions
          WHERE module = 'catalogs' AND action = $1
          LIMIT 1
        `,
          [action]
        );
        if (result.length > 0) {
          catalogPermissionIds[action] = result[0].id;
        }
      }

      // Para cada acción, insertar los role_permissions que faltan (evitando duplicados)
      for (const action of actions) {
        const catalogPermissionId = catalogPermissionIds[action];
        if (!catalogPermissionId) continue;

        await queryRunner.query(
          `
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          SELECT DISTINCT rp.role_id, $1::integer, NOW()
          FROM role_permissions rp
          INNER JOIN permissions p ON rp.permission_id = p.id
          WHERE p.module IN ('areas', 'departments', 'torretas', 'torreta-colors', 'receptors', 'emails')
            AND p.action = $2
            AND NOT EXISTS (
              SELECT 1
              FROM role_permissions rp2
              WHERE rp2.role_id = rp.role_id
                AND rp2.permission_id = $1::integer
            )
        `,
          [catalogPermissionId, action]
        );
      }

      await queryRunner.query(`
        DELETE FROM role_permissions
        WHERE permission_id IN (
          SELECT id
          FROM permissions
          WHERE module IN ('areas', 'departments', 'torretas', 'torreta-colors', 'receptors', 'emails')
        );
      `);
    }

    // Eliminar los permisos antiguos
    await queryRunner.query(`
      DELETE FROM permissions
      WHERE module IN ('areas', 'departments', 'torretas', 'torreta-colors', 'receptors', 'emails');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const actions = ['create', 'read', 'update', 'delete'];
    const oldModules = [
      'areas',
      'departments',
      'departments',
      'torretas',
      'torreta-colors',
      'receptors',
      'emails',
    ];

    for (const oldModule of oldModules) {
      for (const action of actions) {
        await queryRunner.query(
          `
          INSERT INTO permissions (module, action, description, created_at, updated_at)
          SELECT $1, $2, description, created_at, updated_at
          FROM permissions
          WHERE module = 'catalogs' AND action = $2
          LIMIT 1
          ON CONFLICT DO NOTHING;
        `,
          [oldModule, action]
        );
      }
    }

    await queryRunner.query(`
      UPDATE role_permissions rp
      SET permission_id = (
        SELECT p2.id
        FROM permissions p2
        WHERE p2.module = 'areas'
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
        WHERE module = 'catalogs'
      );
    `);
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UnifyAlertModulesToMeasurementAlerts1735000000000
  implements MigrationInterface
{
  name = 'UnifyAlertModulesToMeasurementAlerts1735000000000';

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
      WHERE module IN ('alert-rules', 'alert-messages');
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

    if (rolePermissionsExists[0]?.exists) {
      // Actualizar role_permissions para que apunten a los permisos de measurement-alerts existentes
      await queryRunner.query(`
        UPDATE role_permissions rp
        SET permission_id = (
          SELECT p2.id
          FROM permissions p2
          WHERE p2.module = 'measurement-alerts'
            AND p2.action = (
              SELECT p1.action
              FROM permissions p1
              WHERE p1.id = rp.permission_id
                AND p1.module IN ('alert-rules', 'alert-messages')
            )
          LIMIT 1
        )
        WHERE rp.permission_id IN (
          SELECT id
          FROM permissions
          WHERE module IN ('alert-rules', 'alert-messages')
        )
        AND EXISTS (
          SELECT 1
          FROM permissions p2
          WHERE p2.module = 'measurement-alerts'
            AND p2.action = (
              SELECT p1.action
              FROM permissions p1
              WHERE p1.id = rp.permission_id
            )
        );
      `);
    }

    // Eliminar los permisos antiguos (alert-rules y alert-messages)
    // ya que measurement-alerts ya existe con los mismos permisos
    await queryRunner.query(`
      DELETE FROM permissions
      WHERE module IN ('alert-rules', 'alert-messages');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const actions = ['create', 'read', 'update', 'delete'];

    for (const action of actions) {
      await queryRunner.query(`
        INSERT INTO permissions (module, action, description, created_at, updated_at)
        SELECT 'alert-rules', '${action}', description, created_at, updated_at
        FROM permissions
        WHERE module = 'measurement-alerts' AND action = '${action}'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      `);

      await queryRunner.query(`
        INSERT INTO permissions (module, action, description, created_at, updated_at)
        SELECT 'alert-messages', '${action}', description, created_at, updated_at
        FROM permissions
        WHERE module = 'measurement-alerts' AND action = '${action}'
        LIMIT 1
        ON CONFLICT DO NOTHING;
      `);
    }

    await queryRunner.query(`
      UPDATE role_permissions rp
      SET permission_id = (
        SELECT p2.id
        FROM permissions p2
        WHERE p2.module = 'alert-rules'
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
        WHERE module = 'measurement-alerts'
      );
    `);
  }
}

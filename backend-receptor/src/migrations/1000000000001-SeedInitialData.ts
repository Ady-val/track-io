import { type MigrationInterface, type QueryRunner } from 'typeorm';

/**
 * Datos semilla imprescindibles para que el sistema funcione (PostgreSQL).
 *
 * El baseline (1000000000000) se generó con `migration:generate`, que sólo emite
 * DDL. Estos INSERT vivían en el InitialSchema anterior y deben ejecutarse aparte.
 *
 * Los permisos son críticos: el usuario ADMIN no tiene rol asignado; el backend
 * le concede TODOS los permisos existentes en la tabla `permissions`
 * (ver ADMIN_USERNAME en user.service.ts). Si la tabla está vacía, el admin se
 * queda sin acceso a ninguna pantalla del dashboard.
 *
 * Idempotente: todos los INSERT usan ON CONFLICT DO NOTHING.
 */
export class SeedInitialData1000000000001 implements MigrationInterface {
  // Módulos unificados que expone el dashboard (catalogs agrupa areas,
  // departments, torretas, torreta-colors, receptors y emails).
  private readonly modules = [
    'catalogs',
    'devices',
    'measurements',
    'signals',
    'raw-measurements',
    'message-groups',
    'measurement-alerts',
    'alert-triggers',
    'area-downtime',
    'area-torreta-config',
    'events',
    'users',
    'dashboard',
    'roles-and-permissions',
  ];

  private readonly actions = ['create', 'read', 'update', 'delete'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const module of this.modules) {
      for (const action of this.actions) {
        await queryRunner.query(
          `INSERT INTO permissions (module, action, description, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (module, action) DO NOTHING`,
          [module, action, `Permission to ${action} ${module}`]
        );
      }
    }

    await queryRunner.query(`
      INSERT INTO message_groups (name, color, description, "order") VALUES
      ('Alert', '#eab308', 'Alerta Amarilla', 1),
      ('Warning', '#f97316', 'Advertencia Naranja', 2),
      ('Critical', '#ef4444', 'Crítico Rojo', 3),
      ('Final Escalation', '#dc2626', 'Escalación Final Rojo Oscuro', 4),
      ('Running', '#22c55e', 'En Funcionamiento Verde', 5)
      ON CONFLICT (name) DO NOTHING;
    `);

    // torreta_colors ya no tiene columna "order" (plegado en el baseline).
    await queryRunner.query(`
      INSERT INTO torreta_colors (name, html_color, device_color_id) VALUES
      ('Rojo', '#ef4444', 'R1'),
      ('Verde', '#22c55e', 'G1'),
      ('Azul', '#3b82f6', 'B1'),
      ('Amarillo', '#eab308', 'Y1'),
      ('Naranja', '#f97316', 'O1'),
      ('Morado', '#a855f7', 'P1'),
      ('Rosa', '#ec4899', 'PK1'),
      ('Blanco', '#ffffff', 'W1')
      ON CONFLICT (name) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM torreta_colors WHERE name = ANY($1::varchar[])`,
      [['Rojo', 'Verde', 'Azul', 'Amarillo', 'Naranja', 'Morado', 'Rosa', 'Blanco']]
    );

    await queryRunner.query(
      `DELETE FROM message_groups WHERE name = ANY($1::varchar[])`,
      [['Alert', 'Warning', 'Critical', 'Final Escalation', 'Running']]
    );

    await queryRunner.query(
      `DELETE FROM permissions WHERE module = ANY($1::varchar[])`,
      [this.modules]
    );
  }
}

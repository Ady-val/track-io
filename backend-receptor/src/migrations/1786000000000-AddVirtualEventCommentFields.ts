import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Reportes: para exportar "usuario virtual", "comentario de progreso" y
 * "comentario de cierre" por evento hace falta capturarlos por separado —
 * antes solo se guardaba un `reason`/`comment` en la apertura (botón 1) y los
 * comentarios de los botones 2 y 3 de la botonera virtual se descartaban.
 *
 *  - `virtual_user_name`: usuario logueado en la botonera virtual que abrió
 *    el evento (snapshot, igual que `area_name`/`department_name`).
 *  - `progress_comment`: comentario capturado al pasar a "atendido" (botón 2).
 *  - `close_comment`: comentario capturado al cerrar (botón 3).
 */
export class AddVirtualEventCommentFields1786000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
        ADD COLUMN IF NOT EXISTS "virtual_user_name" character varying(255),
        ADD COLUMN IF NOT EXISTS "progress_comment" text,
        ADD COLUMN IF NOT EXISTS "close_comment" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
        DROP COLUMN IF EXISTS "close_comment",
        DROP COLUMN IF EXISTS "progress_comment",
        DROP COLUMN IF EXISTS "virtual_user_name"
    `);
  }
}

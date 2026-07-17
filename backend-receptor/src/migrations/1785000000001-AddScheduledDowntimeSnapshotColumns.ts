import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega las columnas de descuento por paros programados (crudo + descuento +
 * efectivo + traza) a `events` y `area_downtimes`, más los índices que Fase 2
 * (Reportes) necesita, y hace backfill de las filas ya cerradas.
 *
 * Backfill: antes de esta fase no existían paros programados, así que el
 * descuento histórico real es 0 y el efectivo == crudo. Ver
 * documentation/CLAUDE_CODE_BUILD_SPEC_FASE1.md §8.
 */
export class AddScheduledDowntimeSnapshotColumns1785000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- events: 2 columnas + índice (area_id, closed_at) ---
    // Nota: la traza congelada del evento NO es un jsonb; la Fase 2 la modela
    // como tabla normalizada `event_scheduled_downtime_slices`. Ver
    // PATCH_FASE1_ANTES_DE_CONSTRUIR.md §2.
    await queryRunner.query(`
      ALTER TABLE "events"
        ADD COLUMN IF NOT EXISTS "scheduled_downtime_discount_seconds" integer,
        ADD COLUMN IF NOT EXISTS "effective_duration_seconds" integer
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_events_area_id_closed_at"
        ON "events" ("area_id", "closed_at")
    `);

    await queryRunner.query(`
      UPDATE "events"
      SET "scheduled_downtime_discount_seconds" = 0,
          "effective_duration_seconds" = "duration_seconds"
      WHERE "status" = 'closed'
        AND "duration_seconds" IS NOT NULL
        AND "effective_duration_seconds" IS NULL
    `);

    // --- area_downtimes: 4 columnas + índice (area_id, ends_at) ---
    await queryRunner.query(`
      ALTER TABLE "area_downtimes"
        ADD COLUMN IF NOT EXISTS "duration_seconds" integer,
        ADD COLUMN IF NOT EXISTS "scheduled_downtime_discount_seconds" integer,
        ADD COLUMN IF NOT EXISTS "effective_duration_seconds" integer,
        ADD COLUMN IF NOT EXISTS "scheduled_downtime_snapshot" jsonb
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_area_downtimes_area_id_ends_at"
        ON "area_downtimes" ("area_id", "ends_at")
    `);

    await queryRunner.query(`
      UPDATE "area_downtimes"
      SET "duration_seconds" =
            CAST(EXTRACT(EPOCH FROM ("ends_at" - "start_at")) AS integer),
          "scheduled_downtime_discount_seconds" = 0,
          "effective_duration_seconds" =
            CAST(EXTRACT(EPOCH FROM ("ends_at" - "start_at")) AS integer)
      WHERE "ends_at" IS NOT NULL
        AND "duration_seconds" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_area_downtimes_area_id_ends_at"`
    );
    await queryRunner.query(`
      ALTER TABLE "area_downtimes"
        DROP COLUMN IF EXISTS "scheduled_downtime_snapshot",
        DROP COLUMN IF EXISTS "effective_duration_seconds",
        DROP COLUMN IF EXISTS "scheduled_downtime_discount_seconds",
        DROP COLUMN IF EXISTS "duration_seconds"
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_events_area_id_closed_at"`
    );
    await queryRunner.query(`
      ALTER TABLE "events"
        DROP COLUMN IF EXISTS "effective_duration_seconds",
        DROP COLUMN IF EXISTS "scheduled_downtime_discount_seconds"
    `);
  }
}

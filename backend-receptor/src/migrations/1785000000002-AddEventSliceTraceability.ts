import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 2 — trazabilidad por evento:
 *  - Elimina `events.scheduled_downtime_snapshot` (jsonb) si existiera. La Fase 2
 *    la sustituye por la tabla normalizada `event_scheduled_downtime_slices`.
 *    En un despliegue fresco (Fase 1 ya parcheada) la columna no existe → no-op.
 *  - Agrega `events.response_discount_seconds` (descuento del tramo de atención).
 *  - Crea `event_scheduled_downtime_slices` + sus 3 índices.
 *  - Siembra los 4 permisos del módulo `reports` (idempotente).
 *  - Backfill: response_discount_seconds = 0 para los eventos ya cerrados
 *    (antes de la Fase 2 todo el descuento se atribuye al tramo de solución;
 *    corregible con POST /scheduled-downtimes/recalculate).
 *
 * Ver BUILD_SPEC_FASE2_DASHBOARD.md §2, §4.
 */
export class AddEventSliceTraceability1785000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
        DROP COLUMN IF EXISTS "scheduled_downtime_snapshot"
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
        ADD COLUMN IF NOT EXISTS "response_discount_seconds" integer
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_scheduled_downtime_slices" (
        "id" SERIAL NOT NULL,
        "event_id" integer NOT NULL,
        "scheduled_downtime_id" integer NOT NULL,
        "name" character varying(255) NOT NULL,
        "configured_start_time" TIME NOT NULL,
        "configured_end_time" TIME NOT NULL,
        "occurred_from" TIMESTAMP WITH TIME ZONE NOT NULL,
        "occurred_to" TIMESTAMP WITH TIME ZONE NOT NULL,
        "seconds" integer NOT NULL,
        "segment" character varying(20) NOT NULL,
        "timezone" character varying(64) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_scheduled_downtime_slices" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_slices_event_id"
        ON "event_scheduled_downtime_slices" ("event_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_slices_occurred_from"
        ON "event_scheduled_downtime_slices" ("occurred_from")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_slices_scheduled_downtime_id"
        ON "event_scheduled_downtime_slices" ("scheduled_downtime_id")
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("module", "action", "description", "created_at", "updated_at")
      VALUES
        ('reports', 'create', 'Permission to create reports', NOW(), NOW()),
        ('reports', 'read',   'Permission to read reports',   NOW(), NOW()),
        ('reports', 'update', 'Permission to update reports', NOW(), NOW()),
        ('reports', 'delete', 'Permission to delete reports', NOW(), NOW())
      ON CONFLICT ("module", "action") DO NOTHING
    `);

    await queryRunner.query(`
      UPDATE "events"
      SET "response_discount_seconds" = 0
      WHERE "status" = 'closed'
        AND "response_discount_seconds" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "permissions" p
      WHERE rp."permission_id" = p."id"
        AND p."module" = 'reports'
    `);
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "module" = 'reports'`
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_event_slices_scheduled_downtime_id"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_event_slices_occurred_from"`
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_event_slices_event_id"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "event_scheduled_downtime_slices"`
    );

    await queryRunner.query(`
      ALTER TABLE "events"
        DROP COLUMN IF EXISTS "response_discount_seconds"
    `);
  }
}

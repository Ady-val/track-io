import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla `scheduled_downtimes` (catálogo de paros programados) y siembra
 * los 4 permisos del módulo de forma idempotente.
 *
 * Ver documentation/CLAUDE_CODE_BUILD_SPEC_FASE1.md §8.
 */
export class CreateScheduledDowntimes1785000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "scheduled_downtimes" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "area_id" integer NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "days_of_week" jsonb NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_scheduled_downtimes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_scheduled_downtimes_area_id"
        ON "scheduled_downtimes" ("area_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_scheduled_downtimes_area_id_is_active"
        ON "scheduled_downtimes" ("area_id", "is_active")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'FK_scheduled_downtimes_area_id'
        ) THEN
          ALTER TABLE "scheduled_downtimes"
            ADD CONSTRAINT "FK_scheduled_downtimes_area_id"
            FOREIGN KEY ("area_id") REFERENCES "areas"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    // Semilla idempotente de los 4 permisos del módulo (ON CONFLICT sobre el
    // índice único (module, action)).
    await queryRunner.query(`
      INSERT INTO "permissions" ("module", "action", "description", "created_at", "updated_at")
      VALUES
        ('scheduled-downtimes', 'create', 'Permission to create scheduled downtimes', NOW(), NOW()),
        ('scheduled-downtimes', 'read',   'Permission to read scheduled downtimes',   NOW(), NOW()),
        ('scheduled-downtimes', 'update', 'Permission to update scheduled downtimes', NOW(), NOW()),
        ('scheduled-downtimes', 'delete', 'Permission to delete scheduled downtimes', NOW(), NOW())
      ON CONFLICT ("module", "action") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "permissions" p
      WHERE rp."permission_id" = p."id"
        AND p."module" = 'scheduled-downtimes'
    `);

    await queryRunner.query(`
      DELETE FROM "permissions" WHERE "module" = 'scheduled-downtimes'
    `);

    await queryRunner.query(`
      ALTER TABLE "scheduled_downtimes"
        DROP CONSTRAINT IF EXISTS "FK_scheduled_downtimes_area_id"
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_scheduled_downtimes_area_id_is_active"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_scheduled_downtimes_area_id"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "scheduled_downtimes"`);
  }
}

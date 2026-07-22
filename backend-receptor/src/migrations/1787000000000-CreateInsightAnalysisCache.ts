import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea la tabla `insight_analysis_cache` (caché de resultados del análisis de
 * patrones con IA en Reportes) y siembra los 4 permisos del módulo `insights`
 * de forma idempotente.
 */
export class CreateInsightAnalysisCache1787000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "insight_analysis_cache" (
        "id" SERIAL NOT NULL,
        "cache_key" character varying(64) NOT NULL,
        "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "area_id" integer,
        "findings_json" jsonb NOT NULL,
        "total_events_analyzed" integer NOT NULL,
        "model" character varying(255) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_insight_analysis_cache" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_insight_analysis_cache_cache_key" UNIQUE ("cache_key")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_insight_analysis_cache_expires_at"
        ON "insight_analysis_cache" ("expires_at")
    `);

    // Semilla idempotente de los 4 permisos del módulo (ON CONFLICT sobre el
    // índice único (module, action)).
    await queryRunner.query(`
      INSERT INTO "permissions" ("module", "action", "description", "created_at", "updated_at")
      VALUES
        ('insights', 'create', 'Permission to create insight analyses', NOW(), NOW()),
        ('insights', 'read',   'Permission to read insight analyses',   NOW(), NOW()),
        ('insights', 'update', 'Permission to update insight analyses', NOW(), NOW()),
        ('insights', 'delete', 'Permission to delete insight analyses', NOW(), NOW())
      ON CONFLICT ("module", "action") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "permissions" p
      WHERE rp."permission_id" = p."id"
        AND p."module" = 'insights'
    `);

    await queryRunner.query(`
      DELETE FROM "permissions" WHERE "module" = 'insights'
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_insight_analysis_cache_expires_at"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "insight_analysis_cache"`);
  }
}

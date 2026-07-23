import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega `meta_json` a `insight_analysis_cache`: guarda los notices
 * (agrupación degenerada / muestra chica) y el mini-resumen del periodo
 * junto con los hallazgos cacheados, para que un cache-hit siga mostrando
 * esa información sin tener que re-agregar (ver InsightsService.analyze()).
 */
export class AddMetaJsonToInsightAnalysisCache1788000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "insight_analysis_cache"
      ADD COLUMN IF NOT EXISTS "meta_json" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "insight_analysis_cache"
      DROP COLUMN IF EXISTS "meta_json"
    `);
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTorretasExternalIdUniqueConstraint1766440356226
  implements MigrationInterface
{
  name = 'UpdateTorretasExternalIdUniqueConstraint1766440356226';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing unique index if it exists
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_torretas_external_id";
    `);

    // Drop any unique constraint on external_id if it exists
    const constraints = await queryRunner.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'torretas'::regclass 
      AND contype = 'u' 
      AND conkey::text LIKE '%external_id%';
    `);

    for (const constraint of constraints) {
      await queryRunner.query(`
        ALTER TABLE torretas DROP CONSTRAINT IF EXISTS "${constraint.conname}";
      `);
    }

    // Check if partial unique index already exists
    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname = 'IDX_torretas_external_id_unique'
      );
    `);

    // Create partial unique index (only for non-deleted torretas)
    if (!indexExists[0].exists) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_torretas_external_id_unique" 
        ON torretas (external_id) 
        WHERE deleted_at IS NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop partial unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_torretas_external_id_unique";
    `);

    // Restore original unique index
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_torretas_external_id" 
      ON torretas (external_id);
    `);
  }
}


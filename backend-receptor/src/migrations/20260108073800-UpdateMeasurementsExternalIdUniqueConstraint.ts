import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMeasurementsExternalIdUniqueConstraint20260108073800
  implements MigrationInterface
{
  name = 'UpdateMeasurementsExternalIdUniqueConstraint20260108073800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, drop any unique constraints on external_id (this will also drop associated indexes)
    const constraints = await queryRunner.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'measurements'::regclass 
      AND contype = 'u' 
      AND conkey::text LIKE '%external_id%';
    `);

    for (const constraint of constraints) {
      await queryRunner.query(`
        ALTER TABLE measurements DROP CONSTRAINT IF EXISTS "${constraint.conname}" CASCADE;
      `);
    }

    // Drop any remaining unique indexes that might not be associated with constraints
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_e19784041b690e754745403328";
    `);

    // Also try to drop the constraint directly if it still exists
    await queryRunner.query(`
      ALTER TABLE measurements DROP CONSTRAINT IF EXISTS "UQ_e19784041b690e7547454033285" CASCADE;
    `);

    // Check if partial unique index already exists
    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname = 'IDX_measurements_external_id_unique'
      );
    `);

    // Create partial unique index (only for non-deleted measurements)
    if (!indexExists[0].exists) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_measurements_external_id_unique" 
        ON measurements (external_id) 
        WHERE deleted_at IS NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop partial unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_measurements_external_id_unique";
    `);

    // Restore original unique index
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_e19784041b690e754745403328" 
      ON measurements (external_id);
    `);
  }
}


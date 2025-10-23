import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class RemoveExternalValueIdUniqueConstraint1704068500000
  implements MigrationInterface
{
  name = 'RemoveExternalValueIdUniqueConstraint1704068500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si existe una restricción de unicidad en external_value_id
    const uniqueConstraints = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'device_signals' 
      AND constraint_type = 'UNIQUE'
      AND constraint_name LIKE '%external_value_id%'
    `);

    // Si existe una restricción de unicidad, eliminarla
    for (const constraint of uniqueConstraints) {
      await queryRunner.query(`
        ALTER TABLE device_signals 
        DROP CONSTRAINT IF EXISTS ${constraint.constraint_name}
      `);
    }

    // También verificar índices únicos
    const uniqueIndexes = await queryRunner.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'device_signals' 
      AND indexdef LIKE '%UNIQUE%'
      AND indexdef LIKE '%external_value_id%'
    `);

    // Eliminar índices únicos si existen
    for (const index of uniqueIndexes) {
      await queryRunner.query(`
        DROP INDEX IF EXISTS ${index.indexname}
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Crear un índice único en external_value_id (revertir el cambio)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IDX_DEVICE_SIGNALS_EXTERNAL_VALUE_ID_UNIQUE 
      ON device_signals (external_value_id) 
      WHERE deleted_at IS NULL
    `);
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Normalizes area_downtimes columns for SQL Server deployments where
 * InitialSchema created start_time/end_time but runtime entities expect
 * start_at/is_active/ends_at.
 */
export class FixAreaDowntimeMssqlColumns1769200000000
  implements MigrationInterface
{
  name = 'FixAreaDowntimeMssqlColumns1769200000000';

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!this.isMSSQL(queryRunner)) {
      return;
    }

    const tableCheck = await queryRunner.query(`
      SELECT COUNT(*) AS count
      FROM sys.tables
      WHERE name = 'area_downtimes';
    `);

    if (!tableCheck[0] || Number(tableCheck[0].count) === 0) {
      return;
    }

    await queryRunner.query(`
      IF COL_LENGTH('area_downtimes', 'start_at') IS NULL
      BEGIN
        ALTER TABLE area_downtimes ADD start_at DATETIME2 NULL;
      END
    `);

    await queryRunner.query(`
      UPDATE area_downtimes
      SET start_at = COALESCE(start_at, start_time, created_at, GETDATE())
      WHERE start_at IS NULL;
    `);

    await queryRunner.query(`
      IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID('area_downtimes')
          AND name = 'start_at'
          AND is_nullable = 1
      )
      BEGIN
        ALTER TABLE area_downtimes ALTER COLUMN start_at DATETIME2 NOT NULL;
      END
    `);

    await queryRunner.query(`
      IF COL_LENGTH('area_downtimes', 'ends_at') IS NULL
      BEGIN
        ALTER TABLE area_downtimes ADD ends_at DATETIME2 NULL;
      END
    `);

    await queryRunner.query(`
      UPDATE area_downtimes
      SET ends_at = COALESCE(ends_at, end_time)
      WHERE ends_at IS NULL;
    `);

    await queryRunner.query(`
      IF COL_LENGTH('area_downtimes', 'is_active') IS NULL
      BEGIN
        ALTER TABLE area_downtimes
        ADD is_active BIT NOT NULL
          CONSTRAINT DF_area_downtimes_is_active DEFAULT 1;
      END
    `);

    await queryRunner.query(`
      UPDATE area_downtimes
      SET is_active = CASE
        WHEN COALESCE(ends_at, end_time) IS NULL THEN 1
        ELSE 0
      END;
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_area_downtimes_area_active'
          AND object_id = OBJECT_ID('area_downtimes')
      )
      BEGIN
        CREATE INDEX IDX_area_downtimes_area_active
        ON area_downtimes (area_id, is_active);
      END
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_area_downtimes_area_start'
          AND object_id = OBJECT_ID('area_downtimes')
      )
      BEGIN
        CREATE INDEX IDX_area_downtimes_area_start
        ON area_downtimes (area_id, start_at);
      END
    `);

    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = 'IDX_area_downtimes_start_at'
          AND object_id = OBJECT_ID('area_downtimes')
      )
      BEGIN
        CREATE INDEX IDX_area_downtimes_start_at
        ON area_downtimes (start_at);
      END
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally no-op: dropping normalized columns can destroy live data.
  }
}

import type { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveMeasurementsExternalIdUniqueConstraint1769104800000
  implements MigrationInterface
{
  name = "RemoveMeasurementsExternalIdUniqueConstraint1769104800000";

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === "mssql";
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    let tableExists = false;
    if (isMSSQL) {
      const tableCheck = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.tables
        WHERE name = 'measurements';
      `);
      tableExists = tableCheck[0].count > 0;
    } else {
      const tableCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'measurements'
        );
      `);
      tableExists = tableCheck[0].exists;
    }

    if (!tableExists) {
      return;
    }

    if (isMSSQL) {
      const constraints = await queryRunner.query(`
        SELECT kc.name
        FROM sys.key_constraints kc
        WHERE kc.parent_object_id = OBJECT_ID('measurements')
        AND kc.type = 'UQ'
        AND kc.name LIKE '%external_id%';
      `);

      for (const constraint of constraints) {
        await queryRunner.query(`
          ALTER TABLE measurements DROP CONSTRAINT IF EXISTS [${constraint.name}];
        `);
      }

      await queryRunner.query(`
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_e19784041b690e7547454033285' AND object_id = OBJECT_ID('measurements'))
          ALTER TABLE measurements DROP CONSTRAINT [UQ_e19784041b690e7547454033285];
      `);

      await queryRunner.query(`
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_e19784041b690e754745403328' AND object_id = OBJECT_ID('measurements'))
          DROP INDEX IDX_e19784041b690e754745403328 ON measurements;
      `);

      await queryRunner.query(`
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_measurements_external_id_unique' AND object_id = OBJECT_ID('measurements'))
          DROP INDEX IDX_measurements_external_id_unique ON measurements;
      `);
    } else {
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

      await queryRunner.query(`
        ALTER TABLE measurements DROP CONSTRAINT IF EXISTS "UQ_e19784041b690e7547454033285" CASCADE;
      `);

      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_e19784041b690e754745403328";
      `);

      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_measurements_external_id_unique";
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    if (isMSSQL) {
      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_measurements_external_id_unique' AND object_id = OBJECT_ID('measurements'))
          CREATE UNIQUE NONCLUSTERED INDEX IDX_measurements_external_id_unique
          ON measurements (external_id)
          WHERE deleted_at IS NULL;
      `);
    } else {
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_measurements_external_id_unique"
        ON measurements (external_id)
        WHERE deleted_at IS NULL;
      `);
    }
  }
}

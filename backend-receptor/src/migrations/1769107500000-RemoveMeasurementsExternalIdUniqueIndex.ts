import type { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveMeasurementsExternalIdUniqueIndex1769107500000
  implements MigrationInterface
{
  name = "RemoveMeasurementsExternalIdUniqueIndex1769107500000";

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
      await queryRunner.query(`
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_measurements_external_id' AND object_id = OBJECT_ID('measurements'))
          DROP INDEX IDX_measurements_external_id ON measurements;
      `);
    } else {
      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_measurements_external_id";
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    if (isMSSQL) {
      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IDX_measurements_external_id' AND object_id = OBJECT_ID('measurements'))
          CREATE UNIQUE NONCLUSTERED INDEX IDX_measurements_external_id
          ON measurements (external_id);
      `);
    } else {
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_measurements_external_id"
        ON measurements (external_id);
      `);
    }
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDashboardMeasurementOrderToGroups1769194800000
  implements MigrationInterface
{
  name = 'AddDashboardMeasurementOrderToGroups1769194800000';

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  private async columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string
  ): Promise<boolean> {
    const isMSSQL = this.isMSSQL(queryRunner);

    if (isMSSQL) {
      const result = await queryRunner.query(
        `
        SELECT COUNT(*) as count
        FROM sys.columns
        WHERE object_id = OBJECT_ID(@0)
        AND name = @1;
      `,
        [tableName, columnName]
      );
      return result[0].count > 0;
    }

    const result = await queryRunner.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
      );
    `,
      [tableName, columnName]
    );
    return result[0].exists;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    let tableExists = false;
    if (isMSSQL) {
      const tableCheck = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.tables
        WHERE name = 'dashboard_measurement_groups';
      `);
      tableExists = tableCheck[0].count > 0;
    } else {
      const tableCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'dashboard_measurement_groups'
        );
      `);
      tableExists = tableCheck[0].exists;
    }

    if (!tableExists) {
      return;
    }

    if (
      !(await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'dashboard_measurement_order'
      ))
    ) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups
          ADD dashboard_measurement_order NVARCHAR(MAX) NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups
          ADD COLUMN dashboard_measurement_order jsonb;
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    let tableExists = false;
    if (isMSSQL) {
      const tableCheck = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.tables
        WHERE name = 'dashboard_measurement_groups';
      `);
      tableExists = tableCheck[0].count > 0;
    } else {
      const tableCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'dashboard_measurement_groups'
        );
      `);
      tableExists = tableCheck[0].exists;
    }

    if (!tableExists) {
      return;
    }

    if (
      await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'dashboard_measurement_order'
      )
    ) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups
          DROP COLUMN dashboard_measurement_order;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups
          DROP COLUMN IF EXISTS dashboard_measurement_order;
        `);
      }
    }
  }
}

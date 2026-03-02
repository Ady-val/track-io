import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecondChartConfigToDashboardMeasurementGroups1769601600000
  implements MigrationInterface
{
  name = 'AddSecondChartConfigToDashboardMeasurementGroups1769601600000';

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

    // Check if table exists
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
      // Table doesn't exist yet, skip this migration
      return;
    }

    // Add chart2_time_range column
    if (
      !(await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'chart2_time_range'
      ))
    ) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD chart2_time_range INT NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD COLUMN chart2_time_range integer;
        `);
      }
    }

    // Add chart2_min_value column
    if (
      !(await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'chart2_min_value'
      ))
    ) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD chart2_min_value DECIMAL(10,2) NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD COLUMN chart2_min_value decimal(10,2);
        `);
      }
    }

    // Add chart2_max_value column
    if (
      !(await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'chart2_max_value'
      ))
    ) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD chart2_max_value DECIMAL(10,2) NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD COLUMN chart2_max_value decimal(10,2);
        `);
      }
    }

    // Add chart2_measurement_ids column
    if (
      !(await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'chart2_measurement_ids'
      ))
    ) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD chart2_measurement_ids NVARCHAR(MAX) NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD COLUMN chart2_measurement_ids jsonb;
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    // Check if table exists
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

    // Drop chart2_measurement_ids column
    if (
      await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'chart2_measurement_ids'
      )
    ) {
      if (isMSSQL) {
        const indexes = await queryRunner.query(`
          SELECT i.name as index_name
          FROM sys.indexes i
          INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE i.object_id = OBJECT_ID('dashboard_measurement_groups')
          AND c.name = 'chart2_measurement_ids'
          AND i.name IS NOT NULL;
        `);

        for (const idx of indexes) {
          await queryRunner.query(`
            DROP INDEX IF EXISTS [${idx.index_name}] ON dashboard_measurement_groups;
          `);
        }

        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN chart2_measurement_ids;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN IF EXISTS chart2_measurement_ids;
        `);
      }
    }

    // Drop chart2_max_value column
    if (
      await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'chart2_max_value'
      )
    ) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN chart2_max_value;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN IF EXISTS chart2_max_value;
        `);
      }
    }

    // Drop chart2_min_value column
    if (
      await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'chart2_min_value'
      )
    ) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN chart2_min_value;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN IF EXISTS chart2_min_value;
        `);
      }
    }

    // Drop chart2_time_range column
    if (
      await this.columnExists(
        queryRunner,
        'dashboard_measurement_groups',
        'chart2_time_range'
      )
    ) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN chart2_time_range;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN IF EXISTS chart2_time_range;
        `);
      }
    }
  }
}

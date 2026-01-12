import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChartConfigToDashboardMeasurementGroups1767047227618
  implements MigrationInterface
{
  name = 'AddChartConfigToDashboardMeasurementGroups1767047227618';

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
    const isMSSQL = this.isMSSQL(queryRunner);
    
    if (isMSSQL) {
      const result = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.columns
        WHERE object_id = OBJECT_ID(@0)
        AND name = @1;
      `, [tableName, columnName]);
      return result[0].count > 0;
    } else {
      const result = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        );
      `, [tableName, columnName]);
      return result[0].exists;
    }
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

    // Add chart_time_range column
    if (!(await this.columnExists(queryRunner, 'dashboard_measurement_groups', 'chart_time_range'))) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD chart_time_range INT NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD COLUMN chart_time_range integer;
        `);
      }
    }

    // Add chart_min_value column
    if (!(await this.columnExists(queryRunner, 'dashboard_measurement_groups', 'chart_min_value'))) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD chart_min_value DECIMAL(10,2) NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD COLUMN chart_min_value decimal(10,2);
        `);
      }
    }

    // Add chart_max_value column
    if (!(await this.columnExists(queryRunner, 'dashboard_measurement_groups', 'chart_max_value'))) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD chart_max_value DECIMAL(10,2) NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD COLUMN chart_max_value decimal(10,2);
        `);
      }
    }

    // Add chart_measurement_ids column (jsonb for PostgreSQL, nvarchar(max) for SQL Server)
    if (!(await this.columnExists(queryRunner, 'dashboard_measurement_groups', 'chart_measurement_ids'))) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD chart_measurement_ids NVARCHAR(MAX) NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          ADD COLUMN chart_measurement_ids jsonb;
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

    // Drop chart_measurement_ids column
    if (await this.columnExists(queryRunner, 'dashboard_measurement_groups', 'chart_measurement_ids')) {
      if (isMSSQL) {
        // Drop dependent objects first
        const indexes = await queryRunner.query(`
          SELECT i.name as index_name
          FROM sys.indexes i
          INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE i.object_id = OBJECT_ID('dashboard_measurement_groups')
          AND c.name = 'chart_measurement_ids'
          AND i.name IS NOT NULL;
        `);

        for (const idx of indexes) {
          await queryRunner.query(`
            DROP INDEX IF EXISTS [${idx.index_name}] ON dashboard_measurement_groups;
          `);
        }

        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN chart_measurement_ids;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN IF EXISTS chart_measurement_ids;
        `);
      }
    }

    // Drop chart_max_value column
    if (await this.columnExists(queryRunner, 'dashboard_measurement_groups', 'chart_max_value')) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN chart_max_value;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN IF EXISTS chart_max_value;
        `);
      }
    }

    // Drop chart_min_value column
    if (await this.columnExists(queryRunner, 'dashboard_measurement_groups', 'chart_min_value')) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN chart_min_value;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN IF EXISTS chart_min_value;
        `);
      }
    }

    // Drop chart_time_range column
    if (await this.columnExists(queryRunner, 'dashboard_measurement_groups', 'chart_time_range')) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN chart_time_range;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE dashboard_measurement_groups 
          DROP COLUMN IF EXISTS chart_time_range;
        `);
      }
    }
  }
}

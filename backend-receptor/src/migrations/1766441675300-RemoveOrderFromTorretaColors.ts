import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOrderFromTorretaColors1766441675300
  implements MigrationInterface
{
  name = 'RemoveOrderFromTorretaColors1766441675300';

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    // Check if torreta_colors table exists
    let tableExists = false;
    if (isMSSQL) {
      const tableCheck = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.tables 
        WHERE name = 'torreta_colors';
      `);
      tableExists = tableCheck[0].count > 0;
    } else {
      const tableCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'torreta_colors'
        );
      `);
      tableExists = tableCheck[0].exists;
    }

    if (!tableExists) {
      // Table doesn't exist yet, skip this migration
      return;
    }

    // Check if column exists
    let columnExists = false;
    if (isMSSQL) {
      const columnCheck = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.columns
        WHERE object_id = OBJECT_ID('torreta_colors')
        AND name = 'order';
      `);
      columnExists = columnCheck[0].count > 0;
    } else {
      const columnCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'torreta_colors' 
          AND column_name = 'order'
        );
      `);
      columnExists = columnCheck[0].exists;
    }

    if (!columnExists) {
      // Column doesn't exist, nothing to do
      return;
    }

    if (isMSSQL) {
      // SQL Server: Drop dependent objects first (indexes, constraints, etc.)
      // Drop indexes that reference the column
      const indexes = await queryRunner.query(`
        SELECT i.name as index_name
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
        INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
        WHERE i.object_id = OBJECT_ID('torreta_colors')
        AND c.name = 'order'
        AND i.name IS NOT NULL;
      `);

      for (const idx of indexes) {
        await queryRunner.query(`
          DROP INDEX IF EXISTS [${idx.index_name}] ON torreta_colors;
        `);
      }

      // Drop default constraints
      const constraints = await queryRunner.query(`
        SELECT dc.name as constraint_name
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
        WHERE dc.parent_object_id = OBJECT_ID('torreta_colors')
        AND c.name = 'order';
      `);

      for (const constraint of constraints) {
        await queryRunner.query(`
          ALTER TABLE torreta_colors DROP CONSTRAINT IF EXISTS [${constraint.constraint_name}];
        `);
      }

      // Now drop the column
      await queryRunner.query(`
        ALTER TABLE torreta_colors DROP COLUMN [order];
      `);
    } else {
      // PostgreSQL: Drop the order column from torreta_colors table
      await queryRunner.query(`
        ALTER TABLE torreta_colors 
        DROP COLUMN IF EXISTS "order";
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    // Check if column exists
    let columnExists = false;
    if (isMSSQL) {
      const columnCheck = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.columns
        WHERE object_id = OBJECT_ID('torreta_colors')
        AND name = 'order';
      `);
      columnExists = columnCheck[0].count > 0;
    } else {
      const columnCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'torreta_colors' 
          AND column_name = 'order'
        );
      `);
      columnExists = columnCheck[0].exists;
    }

    if (columnExists) {
      // Column already exists, nothing to do
      return;
    }

    if (isMSSQL) {
      // SQL Server: Restore the order column
      await queryRunner.query(`
        ALTER TABLE torreta_colors 
        ADD [order] INT DEFAULT 0;
      `);
    } else {
      // PostgreSQL: Restore the order column
      await queryRunner.query(`
        ALTER TABLE torreta_colors 
        ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
      `);
    }
  }
}

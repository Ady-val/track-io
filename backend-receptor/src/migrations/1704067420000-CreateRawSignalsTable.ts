import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateRawSignalsTable1704067420000 implements MigrationInterface {
  name = 'CreateRawSignalsTable1704067420000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'raw_signals',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'raw_signals',
      new TableIndex({
        name: 'idx_raw_signals_external_id',
        columnNames: ['external_id'],
      })
    );

    await queryRunner.createIndex(
      'raw_signals',
      new TableIndex({
        name: 'idx_raw_signals_created_at',
        columnNames: ['created_at'],
      })
    );

    // Create the trigger function for updating updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create the trigger
    await queryRunner.query(`
      CREATE TRIGGER update_raw_signals_updated_at 
          BEFORE UPDATE ON raw_signals 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_raw_signals_updated_at ON raw_signals;`
    );

    // Drop the trigger function
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_updated_at_column();`
    );

    // Drop the table
    await queryRunner.dropTable('raw_signals');
  }
}

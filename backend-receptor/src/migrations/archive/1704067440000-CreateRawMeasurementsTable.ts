import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateRawMeasurementsTable1704067440000
  implements MigrationInterface
{
  name = 'CreateRawMeasurementsTable1704067440000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'raw_measurements',
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
      'raw_measurements',
      new TableIndex({
        name: 'IDX_RAW_MEASUREMENTS_EXTERNAL_ID',
        columnNames: ['external_id'],
      })
    );

    await queryRunner.createIndex(
      'raw_measurements',
      new TableIndex({
        name: 'IDX_RAW_MEASUREMENTS_CREATED_AT',
        columnNames: ['created_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('raw_measurements');
  }
}

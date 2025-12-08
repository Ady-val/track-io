import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateMeasurementValuesTable1704067560000
  implements MigrationInterface
{
  name = 'CreateMeasurementValuesTable1704067560000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'measurement_values',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'measurement_id',
            type: 'integer',
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
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'measurement_values',
      new TableIndex({
        name: 'IDX_MEASUREMENT_VALUES_MEASUREMENT_ID',
        columnNames: ['measurement_id'],
      })
    );

    await queryRunner.createIndex(
      'measurement_values',
      new TableIndex({
        name: 'IDX_MEASUREMENT_VALUES_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'measurement_values',
      new TableForeignKey({
        name: 'FK_MEASUREMENT_VALUES_MEASUREMENT',
        columnNames: ['measurement_id'],
        referencedTableName: 'measurements',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('measurement_values');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        fk => fk.name === 'FK_MEASUREMENT_VALUES_MEASUREMENT'
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('measurement_values', foreignKey);
      }
    }
    await queryRunner.dropTable('measurement_values');
  }
}

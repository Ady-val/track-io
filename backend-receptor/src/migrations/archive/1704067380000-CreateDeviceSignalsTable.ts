import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateDeviceSignalsTable1704067380000
  implements MigrationInterface
{
  name = 'CreateDeviceSignalsTable1704067380000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'device_signals',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'device_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'department_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'external_value_id',
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
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create foreign key constraints
    await queryRunner.createForeignKey(
      'device_signals',
      new TableForeignKey({
        columnNames: ['device_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'devices',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'device_signals',
      new TableForeignKey({
        columnNames: ['department_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'departments',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      'device_signals',
      new TableIndex({
        name: 'IDX_DEVICE_SIGNALS_DEVICE_ID',
        columnNames: ['device_id'],
      })
    );

    await queryRunner.createIndex(
      'device_signals',
      new TableIndex({
        name: 'IDX_DEVICE_SIGNALS_DEPARTMENT_ID',
        columnNames: ['department_id'],
      })
    );

    await queryRunner.createIndex(
      'device_signals',
      new TableIndex({
        name: 'IDX_DEVICE_SIGNALS_EXTERNAL_VALUE_ID',
        columnNames: ['external_value_id'],
      })
    );

    await queryRunner.createIndex(
      'device_signals',
      new TableIndex({
        name: 'IDX_DEVICE_SIGNALS_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'device_signals',
      new TableIndex({
        name: 'IDX_DEVICE_SIGNALS_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('device_signals');
  }
}

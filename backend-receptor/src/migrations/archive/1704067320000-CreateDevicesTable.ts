import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateDevicesTable1704067320000 implements MigrationInterface {
  name = 'CreateDevicesTable1704067320000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'devices',
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
            name: 'area_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
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

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'devices',
      new TableForeignKey({
        columnNames: ['area_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'areas',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      'devices',
      new TableIndex({
        name: 'IDX_DEVICES_EXTERNAL_ID',
        columnNames: ['external_id'],
      })
    );

    await queryRunner.createIndex(
      'devices',
      new TableIndex({
        name: 'IDX_DEVICES_AREA_ID',
        columnNames: ['area_id'],
      })
    );

    await queryRunner.createIndex(
      'devices',
      new TableIndex({
        name: 'IDX_DEVICES_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'devices',
      new TableIndex({
        name: 'IDX_DEVICES_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('devices');
  }
}

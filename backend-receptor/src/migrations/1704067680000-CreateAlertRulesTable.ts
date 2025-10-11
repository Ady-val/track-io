import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateAlertRulesTable1704067680000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'alert_rules',
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
          },
          {
            name: 'measurement_id',
            type: 'integer',
          },
          {
            name: 'mode',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'operator',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'setpoint',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'min_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'max_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
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

    // Create indexes
    await queryRunner.createIndex(
      'alert_rules',
      new TableIndex({
        name: 'IDX_alert_rules_measurement_id',
        columnNames: ['measurement_id'],
      })
    );

    await queryRunner.createIndex(
      'alert_rules',
      new TableIndex({
        name: 'IDX_alert_rules_is_enabled',
        columnNames: ['is_enabled'],
      })
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'alert_rules',
      new TableForeignKey({
        columnNames: ['measurement_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'measurements',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('alert_rules');
  }
}


import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateAlertTriggersTable1704067980000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'alert_triggers',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'alert_rule_id',
            type: 'integer',
          },
          {
            name: 'raw_measurement_id',
            type: 'integer',
          },
          {
            name: 'measurement_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'condition_result',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'messages_triggered',
            type: 'jsonb',
          },
          {
            name: 'triggered_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'alert_triggers',
      new TableIndex({
        name: 'IDX_alert_triggers_alert_rule_id',
        columnNames: ['alert_rule_id'],
      })
    );

    await queryRunner.createIndex(
      'alert_triggers',
      new TableIndex({
        name: 'IDX_alert_triggers_raw_measurement_id',
        columnNames: ['raw_measurement_id'],
      })
    );

    await queryRunner.createIndex(
      'alert_triggers',
      new TableIndex({
        name: 'IDX_alert_triggers_triggered_at',
        columnNames: ['triggered_at'],
      })
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'alert_triggers',
      new TableForeignKey({
        columnNames: ['alert_rule_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'alert_rules',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'alert_triggers',
      new TableForeignKey({
        columnNames: ['raw_measurement_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'raw_measurements',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('alert_triggers');
  }
}


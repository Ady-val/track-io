import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateAlertMessagesTable1704067740000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'alert_messages',
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
            name: 'receptor_type',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'receptor_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'receptor_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'message_content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'message_group_id',
            type: 'integer',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
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
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'alert_messages',
      new TableIndex({
        name: 'IDX_alert_messages_alert_rule_id',
        columnNames: ['alert_rule_id'],
      })
    );

    await queryRunner.createIndex(
      'alert_messages',
      new TableIndex({
        name: 'IDX_alert_messages_message_group_id',
        columnNames: ['message_group_id'],
      })
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'alert_messages',
      new TableForeignKey({
        columnNames: ['alert_rule_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'alert_rules',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'alert_messages',
      new TableForeignKey({
        columnNames: ['message_group_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'message_groups',
        onDelete: 'RESTRICT',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('alert_messages');
  }
}

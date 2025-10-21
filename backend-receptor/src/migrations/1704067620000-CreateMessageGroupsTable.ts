import { type MigrationInterface, type QueryRunner, Table } from 'typeorm';

export class CreateMessageGroupsTable1704067620000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'message_groups',
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
            length: '100',
            isUnique: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'order',
            type: 'integer',
            default: 0,
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

    // Insert default message groups
    await queryRunner.query(`
      INSERT INTO message_groups (name, color, description, "order") VALUES
      ('Alert', '#eab308', 'Alerta Amarilla', 1),
      ('Warning', '#f97316', 'Advertencia Naranja', 2),
      ('Critical', '#ef4444', 'Crítico Rojo', 3),
      ('Final Escalation', '#dc2626', 'Escalación Final Rojo Oscuro', 4),
      ('Running', '#22c55e', 'En Funcionamiento Verde', 5);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('message_groups');
  }
}

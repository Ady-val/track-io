import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateEventsTable1704068220000 implements MigrationInterface {
  name = 'CreateEventsTable1704068220000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'events',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'area_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'area_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'department_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'department_name',
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
            name: 'device_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'device_signal_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'device_signal_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['open', 'in-progress', 'closed'],
            default: "'open'",
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
            name: 'in_progress_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'closed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'duration_seconds',
            type: 'integer',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Crear índices para optimizar consultas
    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_area_department',
        columnNames: ['area_id', 'department_id'],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_device_signal',
        columnNames: ['device_id', 'device_signal_id'],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_created_at',
        columnNames: ['created_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('events', 'IDX_events_created_at');
    await queryRunner.dropIndex('events', 'IDX_events_status');
    await queryRunner.dropIndex('events', 'IDX_events_device_signal');
    await queryRunner.dropIndex('events', 'IDX_events_area_department');
    await queryRunner.dropTable('events');
  }
}

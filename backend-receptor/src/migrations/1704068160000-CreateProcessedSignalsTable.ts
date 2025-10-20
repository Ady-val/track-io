import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateProcessedSignalsTable1704068160000
  implements MigrationInterface
{
  name = 'CreateProcessedSignalsTable1704068160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'processed_signals',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'device_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'device_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'device_signal_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'device_signal_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Crear índices para optimizar consultas
    await queryRunner.createIndex(
      'processed_signals',
      new TableIndex({
        name: 'IDX_processed_signals_device_id',
        columnNames: ['device_id'],
      })
    );

    await queryRunner.createIndex(
      'processed_signals',
      new TableIndex({
        name: 'IDX_processed_signals_device_signal_id',
        columnNames: ['device_signal_id'],
      })
    );

    await queryRunner.createIndex(
      'processed_signals',
      new TableIndex({
        name: 'IDX_processed_signals_created_at',
        columnNames: ['created_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'processed_signals',
      'IDX_processed_signals_created_at'
    );
    await queryRunner.dropIndex(
      'processed_signals',
      'IDX_processed_signals_device_signal_id'
    );
    await queryRunner.dropIndex(
      'processed_signals',
      'IDX_processed_signals_device_id'
    );
    await queryRunner.dropTable('processed_signals');
  }
}

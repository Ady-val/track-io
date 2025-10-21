import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateAreaDowntimesTable1704068300000
  implements MigrationInterface
{
  name = 'CreateAreaDowntimesTable1704068300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'area_downtimes',
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
            name: 'start_at',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'ends_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'related_events',
            type: 'jsonb',
            isNullable: true,
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

    // Crear índices para optimizar consultas
    await queryRunner.createIndex(
      'area_downtimes',
      new TableIndex({
        name: 'IDX_area_downtimes_area_active',
        columnNames: ['area_id', 'is_active'],
      })
    );

    await queryRunner.createIndex(
      'area_downtimes',
      new TableIndex({
        name: 'IDX_area_downtimes_area_start',
        columnNames: ['area_id', 'start_at'],
      })
    );

    await queryRunner.createIndex(
      'area_downtimes',
      new TableIndex({
        name: 'IDX_area_downtimes_start_at',
        columnNames: ['start_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'area_downtimes',
      'IDX_area_downtimes_start_at'
    );
    await queryRunner.dropIndex(
      'area_downtimes',
      'IDX_area_downtimes_area_start'
    );
    await queryRunner.dropIndex(
      'area_downtimes',
      'IDX_area_downtimes_area_active'
    );
    await queryRunner.dropTable('area_downtimes');
  }
}

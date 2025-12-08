import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateAreaDowntimeEventsTable1704068400000
  implements MigrationInterface
{
  name = 'CreateAreaDowntimeEventsTable1704068400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear la tabla area_downtime_events
    await queryRunner.createTable(
      new Table({
        name: 'area_downtime_events',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'area_downtime_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'event_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'added_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
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

    // Crear índices
    await queryRunner.createIndex(
      'area_downtime_events',
      new TableIndex({
        name: 'IDX_area_downtime_events_downtime_event_unique',
        columnNames: ['area_downtime_id', 'event_id'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'area_downtime_events',
      new TableIndex({
        name: 'IDX_area_downtime_events_downtime_id',
        columnNames: ['area_downtime_id'],
      })
    );

    await queryRunner.createIndex(
      'area_downtime_events',
      new TableIndex({
        name: 'IDX_area_downtime_events_event_id',
        columnNames: ['event_id'],
      })
    );

    // Crear foreign keys
    await queryRunner.createForeignKey(
      'area_downtime_events',
      new TableForeignKey({
        columnNames: ['area_downtime_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'area_downtimes',
        onDelete: 'CASCADE',
        name: 'FK_area_downtime_events_area_downtime_id',
      })
    );

    await queryRunner.createForeignKey(
      'area_downtime_events',
      new TableForeignKey({
        columnNames: ['event_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'events',
        onDelete: 'CASCADE',
        name: 'FK_area_downtime_events_event_id',
      })
    );

    // Remover el campo related_events de area_downtimes si existe
    const hasRelatedEventsColumn = await queryRunner.hasColumn(
      'area_downtimes',
      'related_events'
    );
    if (hasRelatedEventsColumn) {
      await queryRunner.dropColumn('area_downtimes', 'related_events');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.dropForeignKey(
      'area_downtime_events',
      'FK_area_downtime_events_event_id'
    );
    await queryRunner.dropForeignKey(
      'area_downtime_events',
      'FK_area_downtime_events_area_downtime_id'
    );

    // Remover índices
    await queryRunner.dropIndex(
      'area_downtime_events',
      'IDX_area_downtime_events_event_id'
    );
    await queryRunner.dropIndex(
      'area_downtime_events',
      'IDX_area_downtime_events_downtime_id'
    );
    await queryRunner.dropIndex(
      'area_downtime_events',
      'IDX_area_downtime_events_downtime_event_unique'
    );

    // Remover la tabla
    await queryRunner.dropTable('area_downtime_events');

    // Agregar de vuelta el campo related_events (aunque no será usado)
    const hasRelatedEventsColumn = await queryRunner.hasColumn(
      'area_downtimes',
      'related_events'
    );
    if (!hasRelatedEventsColumn) {
      await queryRunner.query(`
        ALTER TABLE area_downtimes 
        ADD COLUMN related_events jsonb
      `);
    }
  }
}

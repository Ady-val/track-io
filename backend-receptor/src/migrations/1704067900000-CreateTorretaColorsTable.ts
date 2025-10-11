import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table, TableIndex } from 'typeorm';

export class CreateTorretaColorsTable1704067900000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'torreta_colors',
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
            name: 'html_color',
            type: 'varchar',
            length: '7',
          },
          {
            name: 'device_color_id',
            type: 'varchar',
            length: '10',
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

    await queryRunner.createIndex(
      'torreta_colors',
      new TableIndex({
        name: 'IDX_torreta_colors_name',
        columnNames: ['name'],
        isUnique: true,
      })
    );

    await queryRunner.query(`
      INSERT INTO torreta_colors (name, html_color, device_color_id, "order") VALUES
      ('Rojo', '#ef4444', 'R1', 1),
      ('Verde', '#22c55e', 'G1', 2),
      ('Azul', '#3b82f6', 'B1', 3),
      ('Amarillo', '#eab308', 'Y1', 4),
      ('Naranja', '#f97316', 'O1', 5),
      ('Morado', '#a855f7', 'P1', 6),
      ('Rosa', '#ec4899', 'PK1', 7),
      ('Blanco', '#ffffff', 'W1', 8);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('torreta_colors');
  }
}

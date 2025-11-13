import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHtmlColorToDepartments1730710915000
  implements MigrationInterface
{
  name = 'AddHtmlColorToDepartments1730710915000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar la columna html_color a la tabla departments
    await queryRunner.query(`
      ALTER TABLE departments
      ADD COLUMN html_color VARCHAR(7);
    `);

    // Actualizar los departamentos existentes con el color blanco por defecto
    await queryRunner.query(`
      UPDATE departments
      SET html_color = '#ffffff'
      WHERE html_color IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover la columna html_color de la tabla departments
    await queryRunner.query(`
      ALTER TABLE departments
      DROP COLUMN html_color;
    `);
  }
}


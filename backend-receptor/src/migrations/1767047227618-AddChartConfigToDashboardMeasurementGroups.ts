import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChartConfigToDashboardMeasurementGroups1767047227618
  implements MigrationInterface
{
  name = 'AddChartConfigToDashboardMeasurementGroups1767047227618';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE dashboard_measurement_groups 
      ADD COLUMN IF NOT EXISTS chart_time_range integer;
    `);

    await queryRunner.query(`
      ALTER TABLE dashboard_measurement_groups 
      ADD COLUMN IF NOT EXISTS chart_min_value decimal(10,2);
    `);

    await queryRunner.query(`
      ALTER TABLE dashboard_measurement_groups 
      ADD COLUMN IF NOT EXISTS chart_max_value decimal(10,2);
    `);

    await queryRunner.query(`
      ALTER TABLE dashboard_measurement_groups 
      ADD COLUMN IF NOT EXISTS chart_measurement_ids jsonb;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE dashboard_measurement_groups 
      DROP COLUMN IF EXISTS chart_measurement_ids;
    `);

    await queryRunner.query(`
      ALTER TABLE dashboard_measurement_groups 
      DROP COLUMN IF EXISTS chart_max_value;
    `);

    await queryRunner.query(`
      ALTER TABLE dashboard_measurement_groups 
      DROP COLUMN IF EXISTS chart_min_value;
    `);

    await queryRunner.query(`
      ALTER TABLE dashboard_measurement_groups 
      DROP COLUMN IF EXISTS chart_time_range;
    `);
  }
}

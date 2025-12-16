import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDashboardMeasurementsUniqueConstraint1739000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const constraintExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'UQ_dashboard_measurements_measurement_id'
      );
    `);

    if (constraintExists[0]?.exists) {
      await queryRunner.query(`
        ALTER TABLE dashboard_measurements
        DROP CONSTRAINT UQ_dashboard_measurements_measurement_id;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const constraintExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'UQ_dashboard_measurements_measurement_id'
      );
    `);

    if (!constraintExists[0]?.exists) {
      await queryRunner.query(`
        ALTER TABLE dashboard_measurements
        ADD CONSTRAINT UQ_dashboard_measurements_measurement_id
        UNIQUE (measurement_id);
      `);
    }
  }
}

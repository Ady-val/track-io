import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardMeasurementsTable1704068100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dashboard_measurements table
    await queryRunner.query(`
      CREATE TABLE dashboard_measurements (
        id SERIAL PRIMARY KEY,
        measurement_id INTEGER NOT NULL,
        min_value DECIMAL(10, 2) NOT NULL,
        max_value DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP NULL,
        CONSTRAINT FK_dashboard_measurements_measurement
          FOREIGN KEY (measurement_id)
          REFERENCES measurements(id)
          ON DELETE CASCADE,
        CONSTRAINT UQ_dashboard_measurements_measurement_id
          UNIQUE (measurement_id)
      );
    `);

    // Create index
    await queryRunner.query(`
      CREATE INDEX IDX_dashboard_measurements_measurement_id
      ON dashboard_measurements (measurement_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_dashboard_measurements_measurement_id;
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS dashboard_measurements;
    `);
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardMeasurementGroupsTable1731000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create dashboard_measurement_groups table
    await queryRunner.query(`
      CREATE TABLE dashboard_measurement_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP NULL
      );
    `);

    // Create index on name for faster lookups
    await queryRunner.query(`
      CREATE INDEX IDX_dashboard_measurement_groups_name
      ON dashboard_measurement_groups (name);
    `);

    // Add group_id column to dashboard_measurements table
    await queryRunner.query(`
      ALTER TABLE dashboard_measurements
      ADD COLUMN group_id INTEGER NULL;
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE dashboard_measurements
      ADD CONSTRAINT FK_dashboard_measurements_group
        FOREIGN KEY (group_id)
        REFERENCES dashboard_measurement_groups(id)
        ON DELETE SET NULL;
    `);

    // Create index on group_id
    await queryRunner.query(`
      CREATE INDEX IDX_dashboard_measurements_group_id
      ON dashboard_measurements (group_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_dashboard_measurements_group_id;
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE dashboard_measurements
      DROP CONSTRAINT IF EXISTS FK_dashboard_measurements_group;
    `);

    // Drop group_id column
    await queryRunner.query(`
      ALTER TABLE dashboard_measurements
      DROP COLUMN IF EXISTS group_id;
    `);

    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS IDX_dashboard_measurement_groups_name;
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS dashboard_measurement_groups;
    `);
  }
}



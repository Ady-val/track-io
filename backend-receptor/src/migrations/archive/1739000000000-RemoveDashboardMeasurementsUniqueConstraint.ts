import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDashboardMeasurementsUniqueConstraint1739000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la restricción UNIQUE existe antes de eliminarla
    const constraintExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'UQ_dashboard_measurements_measurement_id'
      );
    `);

    if (constraintExists[0]?.exists) {
      // Eliminar la restricción UNIQUE que impide múltiples configuraciones por measurement_id
      await queryRunner.query(`
        ALTER TABLE dashboard_measurements
        DROP CONSTRAINT UQ_dashboard_measurements_measurement_id;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si ya existe una restricción UNIQUE antes de crearla
    const constraintExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'UQ_dashboard_measurements_measurement_id'
      );
    `);

    if (!constraintExists[0]?.exists) {
      // Recrear la restricción UNIQUE (si es necesario revertir)
      await queryRunner.query(`
        ALTER TABLE dashboard_measurements
        ADD CONSTRAINT UQ_dashboard_measurements_measurement_id
        UNIQUE (measurement_id);
      `);
    }
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to seed measurements and dashboard_measurements from CSV data
 *
 * This migration creates measurements and their corresponding dashboard_measurements
 * based on the provided CSV data:
 * - externalId = ID column from CSV
 * - name = Descripción column from CSV
 * - type = 'temperature' if Tipo_Señal = 'Temperature Sensor', 'status' if 'Digital Input'
 * - Dashboard ranges: temperature (0-120), status (0-1)
 *
 * The migration is idempotent: it skips existing measurements by external_id
 * and only creates dashboard_measurements if they don't already exist.
 */
export class SeedMeasurementsFromCsv1768651367000
  implements MigrationInterface
{
  name = 'SeedMeasurementsFromCsv1768651367000';

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  /**
   * CSV data embedded in the migration
   * Format: { externalId, name, type, minValue, maxValue }
   */
  private readonly csvData = [
    // {
    //   externalId: 'PFC1_M1_DI1',
    //   name: 'Entrada Digital M1 Canal 1',
    //   type: 'status',
    //   minValue: 0,
    //   maxValue: 1,
    // },
    {
      externalId: 'PFC1_M1_DI2',
      name: 'Entrada Digital M1 Canal 2',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'PFC1_M3_TEMP1',
      name: 'Temperatura M3 Canal 1',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC1_M3_TEMP2',
      name: 'Temperatura M3 Canal 2',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC1_M3_TEMP3',
      name: 'Temperatura M3 Canal 3',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC1_M3_TEMP4',
      name: 'Temperatura M3 Canal 4',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC1_M3_TEMP5',
      name: 'Temperatura M3 Canal 5',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC1_M3_TEMP6',
      name: 'Temperatura M3 Canal 6',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC1_M3_TEMP7',
      name: 'Temperatura M3 Canal 7',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC1_M3_TEMP8',
      name: 'Temperatura M3 Canal 8',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M2_DI1',
      name: 'Entrada Digital M2 Canal 1',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'PFC2_M2_DI2',
      name: 'Entrada Digital M2 Canal 2',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'PFC2_M3_DI1',
      name: 'Entrada Digital M3 Canal 1',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'PFC2_M3_DI2',
      name: 'Entrada Digital M3 Canal 2',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'PFC2_M3_DI3',
      name: 'Entrada Digital M3 Canal 3',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'PFC2_M3_DI4',
      name: 'Entrada Digital M3 Canal 4',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'PFC2_M4_TEMP1',
      name: 'Temperatura M4 Canal 1',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M4_TEMP2',
      name: 'Temperatura M4 Canal 2',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M4_TEMP3',
      name: 'Temperatura M4 Canal 3',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M4_TEMP4',
      name: 'Temperatura M4 Canal 4',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M4_TEMP5',
      name: 'Temperatura M4 Canal 5',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M4_TEMP6',
      name: 'Temperatura M4 Canal 6',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M4_TEMP7',
      name: 'Temperatura M4 Canal 7',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M4_TEMP8',
      name: 'Temperatura M4 Canal 8',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M5_TEMP1',
      name: 'Temperatura M5 Canal 1',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M5_TEMP2',
      name: 'Temperatura M5 Canal 2',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M5_TEMP3',
      name: 'Temperatura M5 Canal 3',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M5_TEMP4',
      name: 'Temperatura M5 Canal 4',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M5_TEMP5',
      name: 'Temperatura M5 Canal 5',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M5_TEMP6',
      name: 'Temperatura M5 Canal 6',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M5_TEMP7',
      name: 'Temperatura M5 Canal 7',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M5_TEMP8',
      name: 'Temperatura M5 Canal 8',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M6_TEMP1',
      name: 'Temperatura M6 Canal 1',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M6_TEMP2',
      name: 'Temperatura M6 Canal 2',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M6_TEMP3',
      name: 'Temperatura M6 Canal 3',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M6_TEMP4',
      name: 'Temperatura M6 Canal 4',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M6_TEMP5',
      name: 'Temperatura M6 Canal 5',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M6_TEMP6',
      name: 'Temperatura M6 Canal 6',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M6_TEMP7',
      name: 'Temperatura M6 Canal 7',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M6_TEMP8',
      name: 'Temperatura M6 Canal 8',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M7_TEMP1',
      name: 'Temperatura M7 Canal 1',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M7_TEMP2',
      name: 'Temperatura M7 Canal 2',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M7_TEMP3',
      name: 'Temperatura M7 Canal 3',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M7_TEMP4',
      name: 'Temperatura M7 Canal 4',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M7_TEMP5',
      name: 'Temperatura M7 Canal 5',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M7_TEMP6',
      name: 'Temperatura M7 Canal 6',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M7_TEMP7',
      name: 'Temperatura M7 Canal 7',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
    {
      externalId: 'PFC2_M7_TEMP8',
      name: 'Temperatura M7 Canal 8',
      type: 'temperature',
      minValue: 0,
      maxValue: 120,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);
    const nowFunc = isMSSQL ? 'SYSDATETIMEOFFSET()' : 'NOW()';

    console.log(
      `📊 Seeding ${this.csvData.length} measurements and dashboard_measurements...`
    );

    for (const data of this.csvData) {
      // Check if measurement already exists
      let existingMeasurement: any = null;
      if (isMSSQL) {
        const result = await queryRunner.query(
          `SELECT id FROM measurements WHERE external_id = @0 AND deleted_at IS NULL`,
          [data.externalId]
        );
        existingMeasurement = result.length > 0 ? result[0] : null;
      } else {
        const result = await queryRunner.query(
          `SELECT id FROM measurements WHERE external_id = $1 AND deleted_at IS NULL`,
          [data.externalId]
        );
        existingMeasurement = result.length > 0 ? result[0] : null;
      }

      let measurementId: number;

      if (existingMeasurement) {
        // Measurement exists, use its ID
        measurementId = existingMeasurement.id;
        console.log(
          `  ⏭️  Measurement ${data.externalId} already exists (ID: ${measurementId}), skipping creation`
        );
      } else {
        // Create new measurement
        if (isMSSQL) {
          const result = await queryRunner.query(
            `INSERT INTO measurements (external_id, name, type, created_at, updated_at)
             OUTPUT INSERTED.id
             VALUES (@0, @1, @2, ${nowFunc}, ${nowFunc})`,
            [data.externalId, data.name, data.type]
          );
          measurementId = result[0].id;
        } else {
          const result = await queryRunner.query(
            `INSERT INTO measurements (external_id, name, type, created_at, updated_at)
             VALUES ($1, $2, $3, ${nowFunc}, ${nowFunc})
             RETURNING id`,
            [data.externalId, data.name, data.type]
          );
          measurementId = result[0].id;
        }
        console.log(
          `  ✅ Created measurement ${data.externalId} (ID: ${measurementId})`
        );
      }

      // Check if dashboard_measurement already exists for this measurement
      let existingDashboard: any = null;
      if (isMSSQL) {
        const result = await queryRunner.query(
          `SELECT id FROM dashboard_measurements WHERE measurement_id = @0 AND deleted_at IS NULL`,
          [measurementId]
        );
        existingDashboard = result.length > 0 ? result[0] : null;
      } else {
        const result = await queryRunner.query(
          `SELECT id FROM dashboard_measurements WHERE measurement_id = $1 AND deleted_at IS NULL`,
          [measurementId]
        );
        existingDashboard = result.length > 0 ? result[0] : null;
      }

      if (existingDashboard) {
        console.log(
          `  ⏭️  Dashboard measurement for measurement ID ${measurementId} already exists, skipping creation`
        );
      } else {
        // Create dashboard_measurement
        if (isMSSQL) {
          await queryRunner.query(
            `INSERT INTO dashboard_measurements (measurement_id, min_value, max_value, created_at, updated_at)
             VALUES (@0, @1, @2, ${nowFunc}, ${nowFunc})`,
            [measurementId, data.minValue, data.maxValue]
          );
        } else {
          await queryRunner.query(
            `INSERT INTO dashboard_measurements (measurement_id, min_value, max_value, created_at, updated_at)
             VALUES ($1, $2, $3, ${nowFunc}, ${nowFunc})`,
            [measurementId, data.minValue, data.maxValue]
          );
        }
        console.log(
          `  ✅ Created dashboard measurement for measurement ID ${measurementId} (range: ${data.minValue}-${data.maxValue})`
        );
      }
    }

    console.log('✅ Migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    console.log(
      `🗑️  Removing ${this.csvData.length} measurements and dashboard_measurements...`
    );

    // Delete in reverse order to respect foreign key constraints
    for (const data of this.csvData) {
      // Find measurement by external_id
      let measurement: any = null;
      if (isMSSQL) {
        const result = await queryRunner.query(
          `SELECT id FROM measurements WHERE external_id = @0 AND deleted_at IS NULL`,
          [data.externalId]
        );
        measurement = result.length > 0 ? result[0] : null;
      } else {
        const result = await queryRunner.query(
          `SELECT id FROM measurements WHERE external_id = $1 AND deleted_at IS NULL`,
          [data.externalId]
        );
        measurement = result.length > 0 ? result[0] : null;
      }

      if (measurement) {
        const measurementId = measurement.id;

        // Delete dashboard_measurement first (soft delete)
        if (isMSSQL) {
          await queryRunner.query(
            `UPDATE dashboard_measurements 
             SET deleted_at = SYSDATETIMEOFFSET() 
             WHERE measurement_id = @0 AND deleted_at IS NULL`,
            [measurementId]
          );
        } else {
          await queryRunner.query(
            `UPDATE dashboard_measurements 
             SET deleted_at = NOW() 
             WHERE measurement_id = $1 AND deleted_at IS NULL`,
            [measurementId]
          );
        }

        // Delete measurement (soft delete)
        if (isMSSQL) {
          await queryRunner.query(
            `UPDATE measurements 
             SET deleted_at = SYSDATETIMEOFFSET() 
             WHERE id = @0 AND deleted_at IS NULL`,
            [measurementId]
          );
        } else {
          await queryRunner.query(
            `UPDATE measurements 
             SET deleted_at = NOW() 
             WHERE id = $1 AND deleted_at IS NULL`,
            [measurementId]
          );
        }

        console.log(
          `  ✅ Removed measurement ${data.externalId} and its dashboard_measurement`
        );
      } else {
        console.log(
          `  ⏭️  Measurement ${data.externalId} not found, skipping removal`
        );
      }
    }

    console.log('✅ Rollback completed successfully');
  }
}

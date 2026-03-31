import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds measurements + dashboard_measurements from audited pending list
 * (pending-measurements-audit.csv). Same behavior as SeedMeasurementsFromCsv1768651367000:
 * idempotent by external_id, creates dashboard row with min/max if missing.
 *
 * Type mapping from Tipo_Señal:
 * - Digital Input -> status (dashboard 0-1)
 * - DEW POINT -> dew_point (dashboard -100..100 °C span)
 * - PPM -> ppm (dashboard 0..1_000_000)
 *
 * Requires AddDewPointToMeasurementType and AddPpmToMeasurementType to have run first.
 */
export class SeedPendingMeasurementsAuditCsv1774987290155
  implements MigrationInterface
{
  name = 'SeedPendingMeasurementsAuditCsv1774987290155';

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  /** From pending-measurements-audit.csv (ID, Descripción, Tipo_Señal) */
  private readonly csvData: Array<{
    externalId: string;
    name: string;
    type: 'dew_point' | 'ppm' | 'status';
    minValue: number;
    maxValue: number;
  }> = [
    {
      externalId: 'PFC1_M1_DI1',
      name: 'Entrada Digital M1 Canal 1',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'PFC2_M1_DI1',
      name: 'Entrada Digital M1 Canal 1',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'PFC2_M1_DI2',
      name: 'Entrada Digital M1 Canal 2',
      type: 'status',
      minValue: 0,
      maxValue: 1,
    },
    {
      externalId: 'SEC1_TFD',
      name: 'DEW POINT SECADOR 1',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC1_TDFATM',
      name: 'DEW POINT ADMOSFERICO SECADOR 1',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC1_H20',
      name: 'PPM SECADOR 1',
      type: 'ppm',
      minValue: 0,
      maxValue: 1_000_000,
    },
    {
      externalId: 'SEC2_TFD',
      name: 'DEW POINT SECADOR 2',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC2_TDFATM',
      name: 'DEW POINT ADMOSFERICO SECADOR 2',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC2_H20',
      name: 'PPM SECADOR 2',
      type: 'ppm',
      minValue: 0,
      maxValue: 1_000_000,
    },
    {
      externalId: 'SEC3_TFD',
      name: 'DEW POINT SECADOR 3',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC3_TDFATM',
      name: 'DEW POINT ADMOSFERICO SECADOR 3',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC3_H20',
      name: 'PPM SECADOR 3',
      type: 'ppm',
      minValue: 0,
      maxValue: 1_000_000,
    },
    {
      externalId: 'SEC4_TFD',
      name: 'DEW POINT SECADOR 4',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC4_TDFATM',
      name: 'DEW POINT ADMOSFERICO SECADOR 4',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC4_H20',
      name: 'PPM SECADOR 4',
      type: 'ppm',
      minValue: 0,
      maxValue: 1_000_000,
    },
    {
      externalId: 'SEC5_TFD',
      name: 'DEW POINT SECADOR 5',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC5_TDFATM',
      name: 'DEW POINT ADMOSFERICO SECADOR 5',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC5_H20',
      name: 'PPM SECADOR 5',
      type: 'ppm',
      minValue: 0,
      maxValue: 1_000_000,
    },
    {
      externalId: 'SEC6_TFD',
      name: 'DEW POINT SECADOR 6',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC6_TDFATM',
      name: 'DEW POINT ADMOSFERICO SECADOR 6',
      type: 'dew_point',
      minValue: -100,
      maxValue: 100,
    },
    {
      externalId: 'SEC6_H20',
      name: 'PPM SECADOR 6',
      type: 'ppm',
      minValue: 0,
      maxValue: 1_000_000,
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);
    const nowFunc = isMSSQL ? 'SYSDATETIMEOFFSET()' : 'NOW()';

    console.log(
      `📊 Seeding ${this.csvData.length} measurements and dashboard_measurements (pending audit CSV)...`
    );

    for (const data of this.csvData) {
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
        measurementId = existingMeasurement.id;
        console.log(
          `  ⏭️  Measurement ${data.externalId} already exists (ID: ${measurementId}), skipping creation`
        );
      } else {
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

    console.log('✅ SeedPendingMeasurementsAuditCsv migration completed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    console.log(
      `🗑️  Removing ${this.csvData.length} measurements and dashboard_measurements (pending audit CSV)...`
    );

    for (const data of this.csvData) {
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

    console.log('✅ SeedPendingMeasurementsAuditCsv rollback completed');
  }
}

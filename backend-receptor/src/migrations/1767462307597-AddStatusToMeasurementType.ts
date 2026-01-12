import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToMeasurementType1767462307597
  implements MigrationInterface
{
  name = 'AddStatusToMeasurementType1767462307597';

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    if (isMSSQL) {
      // SQL Server: Add 'status' to the CHECK constraint for measurements.type
      // First, check if the constraint exists and if 'status' is already allowed
      const constraintCheck = await queryRunner.query(`
        SELECT definition
        FROM sys.check_constraints
        WHERE name = 'CK_measurements_type'
        AND parent_object_id = OBJECT_ID('measurements');
      `);

      if (constraintCheck.length > 0) {
        const definition = constraintCheck[0].definition;
        // Check if 'status' is already in the constraint
        if (!definition.includes("'status'")) {
          // Drop the old constraint
          await queryRunner.query(`
            ALTER TABLE measurements DROP CONSTRAINT CK_measurements_type;
          `);
          // Create new constraint with 'status' added
          await queryRunner.query(`
            ALTER TABLE measurements ADD CONSTRAINT CK_measurements_type
            CHECK (type IN ('temperature', 'humidity', 'pressure', 'level', 'flow', 'vibration', 'status'));
          `);
        }
      } else {
        // Constraint doesn't exist, create it with all values including 'status'
        await queryRunner.query(`
          ALTER TABLE measurements ADD CONSTRAINT CK_measurements_type
          CHECK (type IN ('temperature', 'humidity', 'pressure', 'level', 'flow', 'vibration', 'status'));
        `);
      }
    } else {
      // PostgreSQL: Add 'status' to the measurements_type_enum
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TYPE "public"."measurements_type_enum" ADD VALUE IF NOT EXISTS 'status';
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    if (isMSSQL) {
      // SQL Server: Remove 'status' from the CHECK constraint
      const constraintCheck = await queryRunner.query(`
        SELECT definition
        FROM sys.check_constraints
        WHERE name = 'CK_measurements_type'
        AND parent_object_id = OBJECT_ID('measurements');
      `);

      if (constraintCheck.length > 0) {
        const definition = constraintCheck[0].definition;
        if (definition.includes("'status'")) {
          // Drop the old constraint
          await queryRunner.query(`
            ALTER TABLE measurements DROP CONSTRAINT CK_measurements_type;
          `);
          // Create new constraint without 'status'
          await queryRunner.query(`
            ALTER TABLE measurements ADD CONSTRAINT CK_measurements_type
            CHECK (type IN ('temperature', 'humidity', 'pressure', 'level', 'flow', 'vibration'));
          `);
        }
      }
    } else {
      // Note: PostgreSQL does not support removing enum values directly
      // This would require recreating the enum, which is complex and risky
      // For now, we'll leave a comment indicating manual intervention would be needed
      // In production, this should be handled carefully with data migration
      await queryRunner.query(`
        -- Cannot remove enum value 'status' automatically
        -- Manual intervention required if rollback is needed
        SELECT 1;
      `);
    }
  }
}

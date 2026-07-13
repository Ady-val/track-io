import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPpmToMeasurementType1769197800000
  implements MigrationInterface
{
  name = 'AddPpmToMeasurementType1769197800000';

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    if (isMSSQL) {
      const constraintCheck = await queryRunner.query(`
        SELECT definition
        FROM sys.check_constraints
        WHERE name = 'CK_measurements_type'
        AND parent_object_id = OBJECT_ID('measurements');
      `);

      const newValues =
        "('temperature', 'humidity', 'dew_point', 'ppm', 'pressure', 'level', 'flow', 'vibration', 'status')";

      if (constraintCheck.length > 0) {
        const definition = constraintCheck[0].definition;
        if (!definition.includes("'ppm'")) {
          await queryRunner.query(`
            ALTER TABLE measurements DROP CONSTRAINT CK_measurements_type;
          `);
          await queryRunner.query(`
            ALTER TABLE measurements ADD CONSTRAINT CK_measurements_type
            CHECK (type IN ${newValues});
          `);
        }
      } else {
        await queryRunner.query(`
          ALTER TABLE measurements ADD CONSTRAINT CK_measurements_type
          CHECK (type IN ${newValues});
        `);
      }
    } else {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TYPE "public"."measurements_type_enum" ADD VALUE IF NOT EXISTS 'ppm';
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    if (isMSSQL) {
      const constraintCheck = await queryRunner.query(`
        SELECT definition
        FROM sys.check_constraints
        WHERE name = 'CK_measurements_type'
        AND parent_object_id = OBJECT_ID('measurements');
      `);

      if (constraintCheck.length > 0) {
        const definition = constraintCheck[0].definition;
        if (definition.includes("'ppm'")) {
          await queryRunner.query(`
            ALTER TABLE measurements DROP CONSTRAINT CK_measurements_type;
          `);
          await queryRunner.query(`
            ALTER TABLE measurements ADD CONSTRAINT CK_measurements_type
            CHECK (type IN ('temperature', 'humidity', 'dew_point', 'pressure', 'level', 'flow', 'vibration', 'status'));
          `);
        }
      }
    } else {
      await queryRunner.query(`
        -- Cannot remove enum value 'ppm' automatically
        -- Manual intervention required if rollback is needed
        SELECT 1;
      `);
    }
  }
}

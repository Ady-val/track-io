import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToMeasurementType1767462307597
  implements MigrationInterface
{
  name = 'AddStatusToMeasurementType1767462307597';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add 'status' to the measurements_type_enum
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TYPE "public"."measurements_type_enum" ADD VALUE IF NOT EXISTS 'status';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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


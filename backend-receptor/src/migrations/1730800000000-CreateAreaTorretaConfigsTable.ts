import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAreaTorretaConfigsTable1730800000000
  implements MigrationInterface
{
  name = 'CreateAreaTorretaConfigsTable1730800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for configuration_type
    await queryRunner.query(`
      CREATE TYPE "public"."area_torreta_configs_configuration_type_enum" AS ENUM('area', 'department');
    `);

    // Create area_torreta_configs table
    await queryRunner.query(`
      CREATE TABLE "area_torreta_configs" (
        "id" SERIAL NOT NULL,
        "area_id" integer NOT NULL,
        "torreta_external_id" character varying(255) NOT NULL,
        "configuration_type" "public"."area_torreta_configs_configuration_type_enum" NOT NULL DEFAULT 'area',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_area_torreta_configs" PRIMARY KEY ("id")
      );
    `);

    // Create index
    await queryRunner.query(`
      CREATE INDEX "IDX_area_torreta_configs_area_id_torreta_external_id" 
      ON "area_torreta_configs" ("area_id", "torreta_external_id");
    `);

    // Create foreign key
    await queryRunner.query(`
      ALTER TABLE "area_torreta_configs"
      ADD CONSTRAINT "FK_area_torreta_configs_area_id"
      FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE "area_torreta_configs"
      DROP CONSTRAINT "FK_area_torreta_configs_area_id";
    `);

    // Drop index
    await queryRunner.query(`
      DROP INDEX "IDX_area_torreta_configs_area_id_torreta_external_id";
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE "area_torreta_configs"`);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE "public"."area_torreta_configs_configuration_type_enum";
    `);
  }
}


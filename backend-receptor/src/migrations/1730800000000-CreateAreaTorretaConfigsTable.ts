import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAreaTorretaConfigsTable1730800000000
  implements MigrationInterface
{
  name = 'CreateAreaTorretaConfigsTable1730800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si el tipo ENUM ya existe
    const enumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'area_torreta_configs_configuration_type_enum'
      );
    `);

    if (!enumExists[0]?.exists) {
      // Create enum type for configuration_type
      await queryRunner.query(`
        CREATE TYPE "public"."area_torreta_configs_configuration_type_enum" AS ENUM('area', 'department');
      `);
    }

    // Verificar si la tabla ya existe
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'area_torreta_configs'
      );
    `);

    if (!tableExists[0]?.exists) {
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
    }

    // Verificar si el índice ya existe
    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = 'IDX_area_torreta_configs_area_id_torreta_external_id'
      );
    `);

    if (!indexExists[0]?.exists) {
      // Create index
      await queryRunner.query(`
        CREATE INDEX "IDX_area_torreta_configs_area_id_torreta_external_id" 
        ON "area_torreta_configs" ("area_id", "torreta_external_id");
      `);
    }

    // Verificar si la foreign key ya existe
    const fkExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'FK_area_torreta_configs_area_id'
      );
    `);

    if (!fkExists[0]?.exists) {
      // Create foreign key
      await queryRunner.query(`
        ALTER TABLE "area_torreta_configs"
        ADD CONSTRAINT "FK_area_torreta_configs_area_id"
        FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE;
      `);
    }
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

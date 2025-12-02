import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRolesNameUniqueConstraint1734000000000
  implements MigrationInterface
{
  name = 'UpdateRolesNameUniqueConstraint1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_ROLES_NAME";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "roles_name_key";
    `);

    const constraints = await queryRunner.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'roles'::regclass 
      AND contype = 'u' 
      AND conkey::text LIKE '%name%';
    `);

    for (const constraint of constraints) {
      await queryRunner.query(`
        ALTER TABLE roles DROP CONSTRAINT IF EXISTS "${constraint.conname}";
      `);
    }

    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname = 'IDX_ROLES_NAME_UNIQUE'
      );
    `);

    if (!indexExists[0].exists) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_ROLES_NAME_UNIQUE" 
        ON roles (name) 
        WHERE deleted_at IS NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_ROLES_NAME_UNIQUE";
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ROLES_NAME" 
      ON roles (name);
    `);

    await queryRunner.query(`
      ALTER TABLE roles 
      ADD CONSTRAINT "UQ_roles_name" UNIQUE (name);
    `);
  }
}

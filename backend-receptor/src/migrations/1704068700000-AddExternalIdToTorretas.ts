import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExternalIdToTorretas1704068700000
  implements MigrationInterface
{
  name = 'AddExternalIdToTorretas1704068700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if external_id column already exists
    const hasColumn = await queryRunner.hasColumn('torretas', 'external_id');

    if (!hasColumn) {
      await queryRunner.query(`
                ALTER TABLE "torretas" 
                ADD COLUMN "external_id" character varying(255) UNIQUE
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "torretas" DROP COLUMN "external_id"`);
  }
}

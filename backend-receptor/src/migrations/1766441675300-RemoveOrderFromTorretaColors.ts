import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOrderFromTorretaColors1766441675300
  implements MigrationInterface
{
  name = 'RemoveOrderFromTorretaColors1766441675300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the order column from torreta_colors table
    await queryRunner.query(`
      ALTER TABLE torreta_colors 
      DROP COLUMN IF EXISTS "order";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the order column
    await queryRunner.query(`
      ALTER TABLE torreta_colors 
      ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
    `);
  }
}


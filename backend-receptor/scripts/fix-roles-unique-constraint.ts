import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST') ?? 'localhost',
  port: configService.get<number>('DATABASE_PORT') ?? 5432,
  username: configService.get<string>('DATABASE_USERNAME') ?? 'postgres',
  password: configService.get<string>('DATABASE_PASSWORD') ?? 'postgres',
  database: configService.get<string>('DATABASE_NAME') ?? 'track_io',
});

async function fixRolesUniqueConstraint() {
  try {
    await dataSource.initialize();
    console.log('Connected to database');

    const queryRunner = dataSource.createQueryRunner();

    console.log('Dropping existing unique indexes...');
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ROLES_NAME";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "roles_name_key";`);

    console.log('Finding and dropping unique constraints on name column...');
    const constraints = await queryRunner.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'roles'::regclass 
      AND contype = 'u'
      AND conkey::text LIKE '%name%';
    `);

    for (const constraint of constraints) {
      console.log(`Dropping constraint: ${constraint.conname}`);
      await queryRunner.query(
        `ALTER TABLE roles DROP CONSTRAINT IF EXISTS "${constraint.conname}";`
      );
    }

    console.log('Checking if partial unique index exists...');
    const indexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname = 'IDX_ROLES_NAME_UNIQUE'
      );
    `);

    if (!indexExists[0].exists) {
      console.log('Creating partial unique index...');
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_ROLES_NAME_UNIQUE" 
        ON roles (name) 
        WHERE deleted_at IS NULL;
      `);
      console.log('Partial unique index created successfully!');
    } else {
      console.log('Partial unique index already exists.');
    }

    await queryRunner.release();
    await dataSource.destroy();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixRolesUniqueConstraint();





import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

/**
 * Script to regenerate the initial migration from entities
 * 
 * This script connects to an empty database, uses TypeORM synchronize to create
 * the schema, then generates SQL that can be used to update the initial migration.
 * 
 * Usage:
 *   npm run generate:initial-migration
 * 
 * Note: This script is mainly for reference. The initial migration should be
 * manually maintained to ensure it includes all necessary initial data.
 */
dotenv.config({ path: join(__dirname, '../.env') });

async function generateInitialMigration() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env['DATABASE_HOST'] || 'localhost',
    port: parseInt(process.env['DATABASE_PORT'] || '5432'),
    username: process.env['DATABASE_USERNAME'] || 'postgres',
    password: process.env['DATABASE_PASSWORD'] || 'postgres',
    database: process.env['DATABASE_NAME'] || 'track_io_temp',
    entities: [join(__dirname, '../src/**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Note: TypeORM doesn't have a direct way to generate migration SQL from entities
    // This script serves as a reference for the structure
    // The actual initial migration should be maintained manually
    
    console.log('ℹ️  This script is a placeholder for future enhancements.');
    console.log('ℹ️  The initial migration (1000000000000-InitialSchema.ts) should be');
    console.log('    maintained manually to ensure it includes all necessary data.');
    console.log('\n✅ To update the initial migration:');
    console.log('   1. Review entity changes');
    console.log('   2. Update 1000000000000-InitialSchema.ts manually');
    console.log('   3. Ensure initial data (permissions, message_groups, torreta_colors) is included');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

generateInitialMigration();


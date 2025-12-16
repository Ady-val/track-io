import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';

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

    await dataSource.destroy();
  } catch (error) {
    await dataSource.destroy();
    process.exit(1);
  }
}

generateInitialMigration();


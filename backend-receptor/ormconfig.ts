import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

// Load environment variables
require('dotenv').config();

const configService = new ConfigService();

// Determine if we're in production (compiled) or development
// In Docker/production, NODE_ENV is set to 'production' and we use compiled migrations from dist/
const isProduction = process.env['NODE_ENV'] === 'production';

const migrationsPath = isProduction 
  ? ['dist/migrations/*{.ts,.js}'] 
  : ['src/migrations/*{.ts,.js}'];
const entitiesPath = isProduction
  ? ['dist/**/*.entity{.ts,.js}']
  : ['src/**/*.entity{.ts,.js}'];

export default new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST') ?? 'localhost',
  port: configService.get<number>('DATABASE_PORT') ?? 5432,
  username: configService.get<string>('DATABASE_USERNAME') ?? 'postgres',
  password: configService.get<string>('DATABASE_PASSWORD') ?? 'postgres',
  database: configService.get<string>('DATABASE_NAME') ?? 'track_io',
  entities: entitiesPath,
  migrations: migrationsPath,
  synchronize: false, // Always false for migrations
  logging: configService.get<string>('NODE_ENV') === 'development' || configService.get<string>('NODE_ENV') === undefined,
});

import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

// Load environment variables (from .env file if present; Docker injects via env)
require('dotenv').config();

const configService = new ConfigService();

// Helper: ConfigService may not read process.env when used outside NestJS context
const getEnv = (key: string, fallback?: string) =>
  configService.get<string>(key) ?? process.env[key] ?? fallback;

// Determine database type from environment variable (default: postgres)
const databaseType = (getEnv('DATABASE_TYPE') ?? 'postgres').toLowerCase();

// Determine if we're in production (compiled) or development
// In Docker/production, NODE_ENV is set to 'production' and we use compiled migrations from dist/
const isProduction = process.env['NODE_ENV'] === 'production';

const migrationsPath = isProduction 
  ? ['dist/migrations/*{.ts,.js}'] 
  : ['src/migrations/*{.ts,.js}'];
const entitiesPath = isProduction
  ? ['dist/**/*.entity{.ts,.js}']
  : ['src/**/*.entity{.ts,.js}'];

// Base configuration common to all database types
const baseConfig = {
  entities: entitiesPath,
  migrations: migrationsPath,
  synchronize: false, // Always false for migrations
  logging: getEnv('NODE_ENV') === 'development' || getEnv('NODE_ENV') === undefined,
};

// Database-specific configuration
let dataSource: DataSource;

if (databaseType === 'mssql' || databaseType === 'sqlserver') {
  // SQL Server configuration
  const port = getEnv('DATABASE_PORT');
  dataSource = new DataSource({
    type: 'mssql',
    host: getEnv('DATABASE_HOST', 'localhost') ?? 'localhost',
    port: port ? parseInt(port, 10) : 1433,
    username: getEnv('DATABASE_USERNAME', 'sa') ?? 'sa',
    password: getEnv('DATABASE_PASSWORD', '') ?? '',
    database: getEnv('DATABASE_NAME', 'track_io') ?? 'track_io',
    options: {
      encrypt: false, // Use true for production with SSL
      trustServerCertificate: true, // For development, set to false in production
      enableArithAbort: true,
    },
    ...baseConfig,
  });
} else {
  // PostgreSQL configuration (default)
  const port = getEnv('DATABASE_PORT');
  dataSource = new DataSource({
    type: 'postgres',
    host: getEnv('DATABASE_HOST', 'localhost') ?? 'localhost',
    port: port ? parseInt(port, 10) : 5432,
    username: getEnv('DATABASE_USERNAME', 'postgres') ?? 'postgres',
    password: getEnv('DATABASE_PASSWORD', 'postgres') ?? 'postgres',
    database: getEnv('DATABASE_NAME', 'track_io') ?? 'track_io',
    ...baseConfig,
  });
}

export default dataSource;

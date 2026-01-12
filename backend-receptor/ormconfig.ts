import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

// Load environment variables
require('dotenv').config();

const configService = new ConfigService();

// Determine database type from environment variable (default: postgres)
const databaseType = (configService.get<string>('DATABASE_TYPE') ?? 'postgres').toLowerCase();

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
  logging: configService.get<string>('NODE_ENV') === 'development' || configService.get<string>('NODE_ENV') === undefined,
};

// Database-specific configuration
let dataSource: DataSource;

if (databaseType === 'mssql' || databaseType === 'sqlserver') {
  // SQL Server configuration
  const port = configService.get<string>('DATABASE_PORT');
  dataSource = new DataSource({
    type: 'mssql',
    host: configService.get<string>('DATABASE_HOST') ?? 'localhost',
    port: port ? parseInt(port, 10) : 1433,
    username: configService.get<string>('DATABASE_USERNAME') ?? 'sa',
    password: configService.get<string>('DATABASE_PASSWORD') ?? '',
    database: configService.get<string>('DATABASE_NAME') ?? 'track_io',
    options: {
      encrypt: false, // Use true for production with SSL
      trustServerCertificate: true, // For development, set to false in production
      enableArithAbort: true,
    },
    ...baseConfig,
  });
} else {
  // PostgreSQL configuration (default)
  const port = configService.get<string>('DATABASE_PORT');
  dataSource = new DataSource({
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST') ?? 'localhost',
    port: port ? parseInt(port, 10) : 5432,
    username: configService.get<string>('DATABASE_USERNAME') ?? 'postgres',
    password: configService.get<string>('DATABASE_PASSWORD') ?? 'postgres',
    database: configService.get<string>('DATABASE_NAME') ?? 'track_io',
    ...baseConfig,
  });
}

export default dataSource;

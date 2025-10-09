import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

// Load environment variables
require('dotenv').config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST') ?? 'localhost',
  port: configService.get<number>('DATABASE_PORT') ?? 5432,
  username: configService.get<string>('DATABASE_USERNAME') ?? 'postgres',
  password: configService.get<string>('DATABASE_PASSWORD') ?? 'postgres',
  database: configService.get<string>('DATABASE_NAME') ?? 'track_io',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false, // Always false for migrations
  logging: configService.get<string>('NODE_ENV') === 'development',
});

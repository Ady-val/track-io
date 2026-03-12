import { DataSource } from 'typeorm';

require('dotenv').config();

const isProduction = process.env['NODE_ENV'] === 'production';

const migrationsPath = isProduction
  ? ['dist/migrations/*{.ts,.js}']
  : ['src/migrations/*{.ts,.js}'];
const entitiesPath = isProduction
  ? ['dist/**/*.entity{.ts,.js}']
  : ['src/**/*.entity{.ts,.js}'];

const dataSource = new DataSource({
  type: 'mssql',
  host: 'track_io_sql_server',
  port: 1433,
  username: 'sa',
  password: 'YourStrongPassword123!',
  database: 'track_io',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  entities: entitiesPath,
  migrations: migrationsPath,
  synchronize: false,
  logging: !isProduction,
});

export default dataSource;

#!/usr/bin/env node
/**
 * Ejecuta migraciones con config explícita (solo para Docker).
 * Evita problemas con ormconfig/ts-node/dotenv.
 */
const { DataSource } = require('typeorm');
const path = require('path');

const config = {
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
  entities: [path.join(__dirname, '../dist/**/*.entity.js')],
  migrations: [path.join(__dirname, '../dist/migrations/*.js')],
  synchronize: false,
  logging: false,
};

const ds = new DataSource(config);

ds
  .initialize()
  .then(() => ds.runMigrations())
  .then((executed) => {
    console.log(`Migrations OK. Executed: ${executed.length}`);
    return ds.destroy();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
  });

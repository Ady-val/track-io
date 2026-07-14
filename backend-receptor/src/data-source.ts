import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Carga .env solo si existe (desarrollo local); en contenedor las vars vienen del entorno.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('dotenv').config();
} catch {
  // dotenv no disponible: se usan las variables del entorno directamente.
}

/**
 * DataSource para el CLI de TypeORM (migraciones).
 *
 * Usa __dirname para resolver entidades/migraciones tanto en desarrollo
 * (ts-node → src) como en producción (compilado → dist), sin depender del cwd.
 *   - dev:  npx typeorm-ts-node-commonjs -d src/data-source.ts migration:run
 *   - prod: node node_modules/typeorm/cli.js -d dist/data-source.js migration:run
 */
export default new DataSource({
  type: 'postgres',
  host: process.env['DATABASE_HOST'] ?? 'localhost',
  port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
  username: process.env['DATABASE_USERNAME'] ?? 'postgres',
  password: process.env['DATABASE_PASSWORD'] ?? 'postgres',
  database: process.env['DATABASE_NAME'] ?? 'track_io',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env['NODE_ENV'] !== 'production',
});

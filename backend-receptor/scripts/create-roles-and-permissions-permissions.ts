import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

async function createRolesAndPermissionsPermissions() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    username: process.env['DB_USERNAME'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'postgres',
    database: process.env['DB_NAME'] || 'track_io',
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const actions = ['create', 'read', 'update', 'delete'];
    
    for (const action of actions) {
      const existing = await dataSource.query(
        `SELECT id FROM permissions WHERE module = 'roles-and-permissions' AND action = $1`,
        [action]
      );

      if (existing.length === 0) {
        await dataSource.query(
          `INSERT INTO permissions (module, action, description, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          ['roles-and-permissions', action, `Permission to ${action} roles-and-permissions`]
        );
        console.log(`Created permission: roles-and-permissions:${action}`);
      } else {
        console.log(`Permission already exists: roles-and-permissions:${action}`);
      }
    }

    console.log('Done!');
    await dataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

createRolesAndPermissionsPermissions();


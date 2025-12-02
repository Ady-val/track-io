import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

async function ensureRolesAndPermissionsPermissions() {
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
    console.log('✅ Database connection established');

    const actions = ['create', 'read', 'update', 'delete'];
    let createdCount = 0;
    
    for (const action of actions) {
      const existing = await dataSource.query(
        `SELECT id FROM permissions WHERE module = $1 AND action = $2`,
        ['roles-and-permissions', action]
      );

      if (existing.length === 0) {
        await dataSource.query(
          `INSERT INTO permissions (module, action, description, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())`,
          ['roles-and-permissions', action, `Permission to ${action} roles-and-permissions`]
        );
        console.log(`✅ Created permission: roles-and-permissions:${action}`);
        createdCount++;
      } else {
        console.log(`ℹ️  Permission already exists: roles-and-permissions:${action}`);
      }
    }

    if (createdCount === 0) {
      console.log('\n✅ All permissions for roles-and-permissions already exist!');
    } else {
      console.log(`\n✅ Created ${createdCount} new permission(s) for roles-and-permissions`);
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

ensureRolesAndPermissionsPermissions();


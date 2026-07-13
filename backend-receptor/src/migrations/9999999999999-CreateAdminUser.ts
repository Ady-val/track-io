import { type MigrationInterface, type QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Migration to create the initial ADMIN user (PostgreSQL).
 *
 * Credentials are read from environment variables so no default password is
 * baked into the codebase:
 *   - ADMIN_USERNAME
 *   - ADMIN_PASSWORD
 *
 * If either variable is missing, the migration is skipped (safe no-op).
 * It is also idempotent: it checks whether the user already exists first.
 */
export class CreateAdminUser9999999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const username = process.env['ADMIN_USERNAME'];
    const password = process.env['ADMIN_PASSWORD'];

    if (!username || !password) {
      console.warn(
        '⚠️  ADMIN_USERNAME/ADMIN_PASSWORD no definidos; se omite la creación del admin inicial'
      );
      return;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await queryRunner.query(
      `SELECT COUNT(*) as count FROM users WHERE username = $1`,
      [username]
    );
    const adminExists = parseInt(result[0]?.count || '0', 10) > 0;

    if (adminExists) {
      console.log(`⚠️  Usuario ${username} ya existe, saltando creación`);
      return;
    }

    await queryRunner.query(
      `INSERT INTO users (name, username, password, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      ['Administrador', username, hashedPassword]
    );

    console.log(`✅ Usuario ${username} creado exitosamente`);
    console.log(
      '   ⚠️  IMPORTANTE: cambia la contraseña después del primer inicio de sesión'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const username = process.env['ADMIN_USERNAME'];

    if (!username) {
      console.warn(
        '⚠️  ADMIN_USERNAME no definido; se omite la eliminación del admin inicial'
      );
      return;
    }

    await queryRunner.query(`DELETE FROM users WHERE username = $1`, [username]);

    console.log(`✅ Usuario ${username} eliminado`);
  }
}

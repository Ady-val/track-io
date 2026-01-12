import {
  type MigrationInterface,
  type QueryRunner,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Migration to create initial ADMIN user
 * 
 * This migration creates the initial ADMIN user with:
 * - Username: ADMIN
 * - Password: Admin123! (hashed with bcrypt, 10 rounds)
 * 
 * IMPORTANT: This migration uses bcrypt.hashSync which is synchronous.
 * The hash is pre-computed for consistency, but bcrypt.hash would be preferred
 * in application code for non-blocking operations.
 * 
 * To generate a new hash for a different password:
 *   const bcrypt = require('bcrypt');
 *   const hash = bcrypt.hashSync('YourPassword', 10);
 *   console.log(hash);
 * 
 * This migration is safe to run multiple times (checks if user exists first).
 */
export class CreateAdminUser9999999999999 implements MigrationInterface {
  /**
   * Helper function to detect database type
   */
  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  /**
   * Generate bcrypt hash synchronously for migration context
   */
  private getAdminPasswordHash(): string {
    // In migrations, we can use hashSync, but for consistency with the application
    // we'll compute it at runtime (migrations run in Node.js context)
    return bcrypt.hashSync('Admin123!', 10);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    // Generate password hash
    const hashedPassword = this.getAdminPasswordHash();

    // Check if ADMIN user already exists
    let adminExists = false;
    if (isMSSQL) {
      const result = await queryRunner.query(
        `SELECT COUNT(*) as count FROM users WHERE username = @0`,
        ['ADMIN']
      );
      adminExists = result[0]?.count > 0;
    } else {
      const result = await queryRunner.query(
        `SELECT COUNT(*) as count FROM users WHERE username = $1`,
        ['ADMIN']
      );
      adminExists = parseInt(result[0]?.count || '0', 10) > 0;
    }

    if (adminExists) {
      console.log('⚠️  Usuario ADMIN ya existe, saltando creación');
      return;
    }

    // Get current timestamp function
    const nowFunc = isMSSQL ? 'SYSDATETIMEOFFSET()' : 'NOW()';

    // Insert ADMIN user
    if (isMSSQL) {
      await queryRunner.query(
        `INSERT INTO users (name, username, password, created_at, updated_at)
         VALUES (@0, @1, @2, ${nowFunc}, ${nowFunc})`,
        ['Administrador', 'ADMIN', hashedPassword]
      );
    } else {
      await queryRunner.query(
        `INSERT INTO users (name, username, password, created_at, updated_at)
         VALUES ($1, $2, $3, ${nowFunc}, ${nowFunc})`,
        ['Administrador', 'ADMIN', hashedPassword]
      );
    }

    console.log('✅ Usuario ADMIN creado exitosamente');
    console.log('   Username: ADMIN');
    console.log('   Password: Admin123!');
    console.log('   ⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    if (isMSSQL) {
      await queryRunner.query(
        `DELETE FROM users WHERE username = @0`,
        ['ADMIN']
      );
    } else {
      await queryRunner.query(
        `DELETE FROM users WHERE username = $1`,
        ['ADMIN']
      );
    }

    console.log('✅ Usuario ADMIN eliminado');
  }
}

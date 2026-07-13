import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CreateVirtualDeviceRole1773271257507
  implements MigrationInterface
{
  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  private async query(
    queryRunner: QueryRunner,
    mssqlSql: string,
    postgresSql: string,
    params: (string | number)[] = []
  ): Promise<unknown> {
    const sql = this.isMSSQL(queryRunner) ? mssqlSql : postgresSql;
    return queryRunner.query(sql, params);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Ensure permission exists
    await this.query(
      queryRunner,
      `IF NOT EXISTS (
         SELECT 1 FROM permissions WHERE module = @0 AND action = @1
       )
       INSERT INTO permissions (module, action, description, created_at, updated_at)
       VALUES (@0, @1, @2, SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET())`,
      `INSERT INTO permissions (module, action, description, created_at, updated_at)
       SELECT $1, $2, $3, NOW(), NOW()
       WHERE NOT EXISTS (
         SELECT 1 FROM permissions WHERE module = $1 AND action = $2
       )`,
      ['virtual-device', 'create', 'Permission to use virtual device endpoints']
    );

    // 2) Ensure role exists (ignores soft-deleted rows)
    await this.query(
      queryRunner,
      `IF NOT EXISTS (
         SELECT 1 FROM roles WHERE name = @0 AND deleted_at IS NULL
       )
       INSERT INTO roles (name, description, created_at, updated_at, deleted_at)
       VALUES (@0, @1, SYSDATETIMEOFFSET(), SYSDATETIMEOFFSET(), NULL)`,
      `INSERT INTO roles (name, description, created_at, updated_at, deleted_at)
       SELECT $1, $2, NOW(), NOW(), NULL
       WHERE NOT EXISTS (
         SELECT 1 FROM roles WHERE name = $1 AND deleted_at IS NULL
       )`,
      ['Virtual Device User', 'Can access virtual device dedicated endpoints']
    );

    // 3) Assign permission to role
    await this.query(
      queryRunner,
      `DECLARE @roleId INT = (
         SELECT TOP 1 id FROM roles WHERE name = @0 AND deleted_at IS NULL ORDER BY id DESC
       );
       DECLARE @permissionId INT = (
         SELECT TOP 1 id FROM permissions WHERE module = @1 AND action = @2 ORDER BY id DESC
       );
       IF @roleId IS NOT NULL AND @permissionId IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM role_permissions WHERE role_id = @roleId AND permission_id = @permissionId
       )
       INSERT INTO role_permissions (role_id, permission_id, created_at)
       VALUES (@roleId, @permissionId, SYSDATETIMEOFFSET())`,
      `INSERT INTO role_permissions (role_id, permission_id, created_at)
       SELECT r.id, p.id, NOW()
       FROM roles r
       JOIN permissions p
         ON p.module = $2 AND p.action = $3
       WHERE r.name = $1
         AND r.deleted_at IS NULL
         AND NOT EXISTS (
           SELECT 1
           FROM role_permissions rp
           WHERE rp.role_id = r.id AND rp.permission_id = p.id
         )`,
      ['Virtual Device User', 'virtual-device', 'create']
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove relation first
    await this.query(
      queryRunner,
      `DELETE rp
       FROM role_permissions rp
       INNER JOIN roles r ON r.id = rp.role_id
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE r.name = @0 AND p.module = @1 AND p.action = @2`,
      `DELETE FROM role_permissions rp
       USING roles r, permissions p
       WHERE rp.role_id = r.id
         AND rp.permission_id = p.id
         AND r.name = $1
         AND p.module = $2
         AND p.action = $3`,
      ['Virtual Device User', 'virtual-device', 'create']
    );

    // Remove role (user_roles cascades on delete)
    await this.query(
      queryRunner,
      `DELETE FROM roles WHERE name = @0`,
      `DELETE FROM roles WHERE name = $1`,
      ['Virtual Device User']
    );

    // Remove permission
    await this.query(
      queryRunner,
      `DELETE FROM permissions WHERE module = @0 AND action = @1`,
      `DELETE FROM permissions WHERE module = $1 AND action = $2`,
      ['virtual-device', 'create']
    );
  }
}

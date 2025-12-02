import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateRolesAndPermissionsTables1733000000000
  implements MigrationInterface
{
  name = 'CreateRolesAndPermissionsTables1733000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'module',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create unique index on module + action
    await queryRunner.createIndex(
      'permissions',
      new TableIndex({
        name: 'IDX_PERMISSIONS_MODULE_ACTION',
        columnNames: ['module', 'action'],
        isUnique: true,
      })
    );

    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Verificar si el índice ya existe antes de crearlo
    const rolesIndexExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname = 'IDX_ROLES_NAME_UNIQUE'
      );
    `);

    if (!rolesIndexExists[0]?.exists) {
      // Crear índice parcial único directamente (solo para roles no eliminados)
      await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_ROLES_NAME_UNIQUE" 
        ON roles (name) 
        WHERE deleted_at IS NULL;
      `);
    }

    // Create user_roles table (junction table)
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'user_id',
            type: 'integer',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'role_id',
            type: 'integer',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create foreign keys for user_roles
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_USER_ROLES_USER_ID',
      })
    );

    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
        name: 'FK_USER_ROLES_ROLE_ID',
      })
    );

    // Create indexes for user_roles
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_USER_ROLES_USER_ID',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'IDX_USER_ROLES_ROLE_ID',
        columnNames: ['role_id'],
      })
    );

    // Create role_permissions table (junction table)
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'role_id',
            type: 'integer',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'permission_id',
            type: 'integer',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create foreign keys for role_permissions
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
        name: 'FK_ROLE_PERMISSIONS_ROLE_ID',
      })
    );

    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['permission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'permissions',
        onDelete: 'CASCADE',
        name: 'FK_ROLE_PERMISSIONS_PERMISSION_ID',
      })
    );

    // Create indexes for role_permissions
    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'IDX_ROLE_PERMISSIONS_ROLE_ID',
        columnNames: ['role_id'],
      })
    );

    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'IDX_ROLE_PERMISSIONS_PERMISSION_ID',
        columnNames: ['permission_id'],
      })
    );

    // Insert default permissions for all modules
    const modules = [
      'catalogs', // Unifica areas, departments, torretas, torreta-colors, receptors, emails
      'devices',
      'measurements',
      'signals',
      'raw-measurements',
      'message-groups',
      'measurement-alerts',
      'alert-triggers',
      'area-downtime',
      'area-torreta-config',
      'events',
      'users',
      'dashboard',
      'roles-and-permissions',
    ];

    const actions = ['create', 'read', 'update', 'delete'];

    for (const module of modules) {
      for (const action of actions) {
        const description = `Permission to ${action} ${module}`;
        // Use parameterized query to prevent SQL injection
        await queryRunner.query(
          `INSERT INTO permissions (module, action, description, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (module, action) DO NOTHING`,
          [module, action, description]
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (due to foreign keys)
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('user_roles');
    await queryRunner.dropTable('roles');
    await queryRunner.dropTable('permissions');
  }
}

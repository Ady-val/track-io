import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * Initial Schema Migration
 *
 * This migration consolidates all previous migrations into a single initial schema.
 * It creates all tables, indexes, foreign keys, enums, and initial data required
 * for the Track.IO system to function.
 *
 * IMPORTANT: This migration includes initial data for:
 * - permissions (56 records - CRITICAL for RBAC system)
 * - message_groups (5 records - CRITICAL for alert system)
 * - torreta_colors (8 records - IMPORTANT for torreta system)
 *
 * SUPPORTS: PostgreSQL and SQL Server (Microsoft)
 */
export class InitialSchema1000000000000 implements MigrationInterface {
  /**
   * Helper function to detect database type
   */
  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  /**
   * Helper function to get timestamp column type based on database
   */
  private getTimestampType(queryRunner: QueryRunner): string {
    return this.isMSSQL(queryRunner) ? 'datetimeoffset' : 'timestamp with time zone';
  }

  /**
   * Helper function to get default timestamp value based on database
   */
  private getTimestampDefault(queryRunner: QueryRunner): string {
    return this.isMSSQL(queryRunner) ? 'SYSDATETIMEOFFSET()' : 'now()';
  }

  /**
   * Helper function to get boolean column type based on database
   */
  private getBooleanType(queryRunner: QueryRunner): string {
    return this.isMSSQL(queryRunner) ? 'bit' : 'boolean';
  }

  /**
   * Helper function to get serial/integer type for primary keys based on database
   */
  private getSerialType(_queryRunner: QueryRunner): string {
    // Both PostgreSQL and SQL Server use 'integer' for IDENTITY/SERIAL columns
    // The generationStrategy handles the difference
    return 'integer';
  }

  /**
   * Helper function to create CHECK constraint for enum in SQL Server
   */
  private async createEnumCheckConstraint(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    enumValues: string[],
    constraintName: string
  ): Promise<void> {
    if (this.isMSSQL(queryRunner)) {
      const values = enumValues.map((v) => `'${v.replace(/'/g, "''")}'`).join(', ');
      // Escape table and column names for SQL Server
      const escapedTableName = `[${tableName}]`;
      const escapedColumnName = `[${columnName}]`;
      await queryRunner.query(
        `IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = '${constraintName}')
         ALTER TABLE ${escapedTableName} ADD CONSTRAINT [${constraintName}] 
         CHECK (${escapedColumnName} IN (${values}));`
      );
    }
    // For PostgreSQL, enum types are handled separately
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);
    // ============================================================================
    // STEP 1: Create ENUM types (PostgreSQL) or prepare for CHECK constraints (SQL Server)
    // ============================================================================

    // For PostgreSQL: Create ENUM types
    // For SQL Server: ENUMs will be created as CHECK constraints after tables are created
    if (!isMSSQL) {
    // Measurement type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."measurements_type_enum" AS ENUM(
          'temperature', 'humidity', 'pressure', 'level', 'flow', 'vibration'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Event status enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."events_status_enum" AS ENUM('open', 'in-progress', 'closed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Alert rule mode enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."alert_rules_mode_enum" AS ENUM('setpoint', 'window');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Alert message receptor type enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."alert_messages_receptor_type_enum" AS ENUM(
          'telegram', 'torreta', 'correo', 'receptor'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Alert escalation enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."alert_escalation_messages_level_enum" AS ENUM(
          'alert', 'warning', 'escalation1', 'escalation2', 'escalation3', 'close'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."alert_escalation_messages_message_type_enum" AS ENUM(
          'torreta', 'receptor', 'email'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."event_alert_logs_level_enum" AS ENUM(
          'alert', 'warning', 'escalation1', 'escalation2', 'escalation3', 'close'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Area torreta config enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."area_torreta_configs_configuration_type_enum" AS ENUM('area', 'department');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    }

    // ============================================================================
    // STEP 2: Create base tables (no foreign key dependencies)
    // ============================================================================

    // Create areas table
    await queryRunner.createTable(
      new Table({
        name: 'areas',
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
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'areas',
      new TableIndex({
        name: 'IDX_AREAS_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'areas',
      new TableIndex({
        name: 'IDX_AREAS_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );

    // Create departments table
    await queryRunner.createTable(
      new Table({
        name: 'departments',
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
            name: 'html_color',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'departments',
      new TableIndex({
        name: 'IDX_DEPARTMENTS_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'departments',
      new TableIndex({
        name: 'IDX_DEPARTMENTS_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );

    // Create torretas table
    await queryRunner.createTable(
      new Table({
        name: 'torretas',
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
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'is_active',
            type: this.getBooleanType(queryRunner),
            isNullable: false,
            default: this.isMSSQL(queryRunner) ? 1 : true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'torretas',
      new TableIndex({
        name: 'IDX_torretas_external_id',
        columnNames: ['external_id'],
        isUnique: true,
      })
    );

    // Create torreta_colors table
    await queryRunner.createTable(
      new Table({
        name: 'torreta_colors',
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
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'html_color',
            type: 'varchar',
            length: '7',
            isNullable: false,
          },
          {
            name: 'device_color_id',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'order',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'torreta_colors',
      new TableIndex({
        name: 'IDX_torreta_colors_name',
        columnNames: ['name'],
        isUnique: true,
      })
    );

    // Create receptors table
    await queryRunner.createTable(
      new Table({
        name: 'receptors',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: this.getBooleanType(queryRunner),
            isNullable: false,
            default: this.isMSSQL(queryRunner) ? 1 : true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'receptors',
      new TableIndex({
        name: 'IDX_receptors_external_id',
        columnNames: ['external_id'],
        isUnique: true,
      })
    );

    // Create emails table
    await queryRunner.createTable(
      new Table({
        name: 'emails',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create message_groups table
    await queryRunner.createTable(
      new Table({
        name: 'message_groups',
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
            length: '100',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'order',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'message_groups',
      new TableIndex({
        name: 'IDX_message_groups_name',
        columnNames: ['name'],
        isUnique: true,
      })
    );

    // Create measurements table
    await queryRunner.createTable(
      new Table({
        name: 'measurements',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'type',
            ...(isMSSQL
              ? {
                  type: 'varchar',
                  length: '50',
                }
              : {
            type: 'enum',
            enum: [
              'temperature',
              'humidity',
              'pressure',
              'level',
              'flow',
              'vibration',
            ],
                }),
            isNullable: false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'measurements',
      new TableIndex({
        name: 'IDX_measurements_external_id',
        columnNames: ['external_id'],
        isUnique: true,
      })
    );

    // Create raw_signals table
    await queryRunner.createTable(
      new Table({
        name: 'raw_signals',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

    // Create processed_signals table
    await queryRunner.createTable(
      new Table({
        name: 'processed_signals',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

    // Create raw_measurements table
    await queryRunner.createTable(
      new Table({
        name: 'raw_measurements',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'virtual_device',
            type: this.getBooleanType(queryRunner),
            isNullable: false,
            default: this.isMSSQL(queryRunner) ? 0 : false,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'raw_measurements',
      new TableIndex({
        name: 'IDX_raw_measurements_external_id',
        columnNames: ['external_id'],
      })
    );

    await queryRunner.createIndex(
      'raw_measurements',
      new TableIndex({
        name: 'IDX_raw_measurements_created_at',
        columnNames: ['created_at'],
      })
    );

    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
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
            name: 'username',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_USERNAME',
        columnNames: ['username'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_USERS_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );

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
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

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
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create partial unique index on roles.name (only for non-deleted roles)
    // SQL Server supports filtered indexes with same syntax as PostgreSQL
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_ROLES_NAME_UNIQUE" 
      ON roles (name) 
      WHERE deleted_at IS NULL;
    `);

    // ============================================================================
    // STEP 3: Create tables with dependencies (order matters)
    // ============================================================================

    // Create devices table (depends on areas)
    await queryRunner.createTable(
      new Table({
        name: 'devices',
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
            name: 'area_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'is_virtual_device',
            type: this.getBooleanType(queryRunner),
            isNullable: false,
            default: this.isMSSQL(queryRunner) ? 0 : false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'devices',
      new TableIndex({
        name: 'IDX_DEVICES_EXTERNAL_ID',
        columnNames: ['external_id'],
      })
    );

    await queryRunner.createIndex(
      'devices',
      new TableIndex({
        name: 'IDX_DEVICES_AREA_ID',
        columnNames: ['area_id'],
      })
    );

    await queryRunner.createIndex(
      'devices',
      new TableIndex({
        name: 'IDX_DEVICES_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createIndex(
      'devices',
      new TableIndex({
        name: 'IDX_DEVICES_DELETED_AT',
        columnNames: ['deleted_at'],
      })
    );

    await queryRunner.createForeignKey(
      'devices',
      new TableForeignKey({
        columnNames: ['area_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'areas',
        onDelete: this.isMSSQL(queryRunner) ? 'NO ACTION' : 'RESTRICT',
        onUpdate: 'CASCADE',
        name: 'FK_devices_area_id',
      })
    );

    // Create device_signals table (depends on devices and departments)
    await queryRunner.createTable(
      new Table({
        name: 'device_signals',
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
            name: 'device_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'department_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'external_value_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'device_signals',
      new TableIndex({
        name: 'IDX_device_signals_device_id',
        columnNames: ['device_id'],
      })
    );

    await queryRunner.createIndex(
      'device_signals',
      new TableIndex({
        name: 'IDX_device_signals_department_id',
        columnNames: ['department_id'],
      })
    );

    await queryRunner.createIndex(
      'device_signals',
      new TableIndex({
        name: 'IDX_device_signals_external_value_id',
        columnNames: ['external_value_id'],
      })
    );

    await queryRunner.createForeignKey(
      'device_signals',
      new TableForeignKey({
        columnNames: ['device_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'devices',
        onDelete: this.isMSSQL(queryRunner) ? 'NO ACTION' : 'RESTRICT',
        onUpdate: 'CASCADE',
        name: 'FK_device_signals_device_id',
      })
    );

    await queryRunner.createForeignKey(
      'device_signals',
      new TableForeignKey({
        columnNames: ['department_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'departments',
        onDelete: this.isMSSQL(queryRunner) ? 'NO ACTION' : 'RESTRICT',
        onUpdate: 'CASCADE',
        name: 'FK_device_signals_department_id',
      })
    );

    // Create measurement_values table (depends on measurements)
    await queryRunner.createTable(
      new Table({
        name: 'measurement_values',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'measurement_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'measurement_values',
      new TableIndex({
        name: 'IDX_measurement_values_measurement_id',
        columnNames: ['measurement_id'],
      })
    );

    await queryRunner.createIndex(
      'measurement_values',
      new TableIndex({
        name: 'IDX_measurement_values_created_at',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createForeignKey(
      'measurement_values',
      new TableForeignKey({
        columnNames: ['measurement_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'measurements',
        onDelete: 'CASCADE',
        name: 'FK_measurement_values_measurement_id',
      })
    );

    // Create alert_rules table (depends on measurements)
    await queryRunner.createTable(
      new Table({
        name: 'alert_rules',
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
            name: 'measurement_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'mode',
            ...(isMSSQL
              ? {
                  type: 'varchar',
                  length: '50',
                }
              : {
            type: 'enum',
            enum: ['setpoint', 'window'],
                }),
            isNullable: false,
          },
          {
            name: 'operator',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'setpoint',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'min_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'max_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'is_enabled',
            type: this.getBooleanType(queryRunner),
            isNullable: false,
            default: this.isMSSQL(queryRunner) ? 1 : true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'alert_rules',
      new TableIndex({
        name: 'IDX_alert_rules_measurement_id',
        columnNames: ['measurement_id'],
      })
    );

    await queryRunner.createIndex(
      'alert_rules',
      new TableIndex({
        name: 'IDX_alert_rules_is_enabled',
        columnNames: ['is_enabled'],
      })
    );

    await queryRunner.createForeignKey(
      'alert_rules',
      new TableForeignKey({
        columnNames: ['measurement_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'measurements',
        onDelete: 'CASCADE',
        name: 'FK_alert_rules_measurement_id',
      })
    );

    // Create alert_messages table (depends on alert_rules and message_groups)
    await queryRunner.createTable(
      new Table({
        name: 'alert_messages',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'alert_rule_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'receptor_type',
            ...(isMSSQL
              ? {
                  type: 'varchar',
                  length: '50',
                }
              : {
            type: 'enum',
            enum: ['telegram', 'torreta', 'correo', 'receptor'],
                }),
            isNullable: false,
          },
          {
            name: 'message_data',
            ...(isMSSQL
              ? {
                  type: 'nvarchar',
                  length: 'max',
                }
              : {
            type: 'jsonb',
                }),
            isNullable: false,
          },
          {
            name: 'message_group_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
            default: "'pending'",
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'alert_messages',
      new TableIndex({
        name: 'IDX_alert_messages_alert_rule_id',
        columnNames: ['alert_rule_id'],
      })
    );

    await queryRunner.createIndex(
      'alert_messages',
      new TableIndex({
        name: 'IDX_alert_messages_message_group_id',
        columnNames: ['message_group_id'],
      })
    );

    await queryRunner.createForeignKey(
      'alert_messages',
      new TableForeignKey({
        columnNames: ['alert_rule_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'alert_rules',
        onDelete: 'CASCADE',
        name: 'FK_alert_messages_alert_rule_id',
      })
    );

    await queryRunner.createForeignKey(
      'alert_messages',
      new TableForeignKey({
        columnNames: ['message_group_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'message_groups',
        onDelete: this.isMSSQL(queryRunner) ? 'NO ACTION' : 'RESTRICT',
        name: 'FK_alert_messages_message_group_id',
      })
    );

    // Create alert_triggers table (depends on alert_rules and measurement_values)
    await queryRunner.createTable(
      new Table({
        name: 'alert_triggers',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'alert_rule_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'measurement_value_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

    // Create events table (depends on areas, departments, devices, device_signals)
    await queryRunner.createTable(
      new Table({
        name: 'events',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'area_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'area_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'department_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'department_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'device_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'device_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'device_signal_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'device_signal_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            ...(isMSSQL
              ? {
                  type: 'varchar',
                  length: '50',
                }
              : {
            type: 'enum',
            enum: ['open', 'in-progress', 'closed'],
                }),
            isNullable: false,
            default: "'open'",
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'in_progress_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
          {
            name: 'closed_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
          {
            name: 'duration_seconds',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'virtual_device',
            type: this.getBooleanType(queryRunner),
            isNullable: false,
            default: this.isMSSQL(queryRunner) ? 0 : false,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_area_id_department_id',
        columnNames: ['area_id', 'department_id'],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_device_id_device_signal_id',
        columnNames: ['device_id', 'device_signal_id'],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'events',
      new TableIndex({
        name: 'IDX_events_created_at',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createForeignKey(
      'events',
      new TableForeignKey({
        columnNames: ['area_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'areas',
        name: 'FK_events_area_id',
      })
    );

    await queryRunner.createForeignKey(
      'events',
      new TableForeignKey({
        columnNames: ['department_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'departments',
        name: 'FK_events_department_id',
      })
    );

    await queryRunner.createForeignKey(
      'events',
      new TableForeignKey({
        columnNames: ['device_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'devices',
        name: 'FK_events_device_id',
      })
    );

    await queryRunner.createForeignKey(
      'events',
      new TableForeignKey({
        columnNames: ['device_signal_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'device_signals',
        name: 'FK_events_device_signal_id',
      })
    );

    // Create area_downtimes table (depends on areas)
    await queryRunner.createTable(
      new Table({
        name: 'area_downtimes',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'area_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'start_time',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
          },
          {
            name: 'end_time',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
          {
            name: 'reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'area_downtimes',
      new TableForeignKey({
        columnNames: ['area_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'areas',
        name: 'FK_area_downtimes_area_id',
      })
    );

    // Create area_downtime_events table (depends on area_downtimes and events)
    await queryRunner.createTable(
      new Table({
        name: 'area_downtime_events',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'area_downtime_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'event_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'area_downtime_events',
      new TableForeignKey({
        columnNames: ['area_downtime_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'area_downtimes',
        name: 'FK_area_downtime_events_area_downtime_id',
      })
    );

    await queryRunner.createForeignKey(
      'area_downtime_events',
      new TableForeignKey({
        columnNames: ['event_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'events',
        name: 'FK_area_downtime_events_event_id',
      })
    );

    // Create area_torreta_configs table (depends on areas)
    await queryRunner.createTable(
      new Table({
        name: 'area_torreta_configs',
        columns: [
          {
            name: 'id',
            type: this.getSerialType(queryRunner),
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'area_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'torreta_external_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'configuration_type',
            ...(isMSSQL
              ? {
                  type: 'varchar',
                  length: '50',
                }
              : {
                  type: 'enum',
                  enum: ['area', 'department'],
                }),
            isNullable: false,
            default: "'area'",
          },
          {
            name: 'is_active',
            type: this.getBooleanType(queryRunner),
            isNullable: false,
            default: this.isMSSQL(queryRunner) ? 1 : true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      })
    );

    // Create enum CHECK constraint for SQL Server
    if (isMSSQL) {
      await this.createEnumCheckConstraint(
        queryRunner,
        'area_torreta_configs',
        'configuration_type',
        ['area', 'department'],
        'CK_area_torreta_configs_configuration_type'
      );
    }

    await queryRunner.createIndex(
      'area_torreta_configs',
      new TableIndex({
        name: 'IDX_area_torreta_configs_area_id_torreta_external_id',
        columnNames: ['area_id', 'torreta_external_id'],
      })
    );

    await queryRunner.createForeignKey(
      'area_torreta_configs',
      new TableForeignKey({
        columnNames: ['area_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'areas',
        onDelete: 'CASCADE',
        name: 'FK_area_torreta_configs_area_id',
      })
    );

    // Create dashboard_measurement_groups table
    await queryRunner.createTable(
      new Table({
        name: 'dashboard_measurement_groups',
        columns: [
          {
            name: 'id',
            type: this.getSerialType(queryRunner),
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
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      })
    );

    await queryRunner.createIndex(
      'dashboard_measurement_groups',
      new TableIndex({
        name: 'IDX_dashboard_measurement_groups_name',
        columnNames: ['name'],
      })
    );

    // Create dashboard_measurements table (depends on measurements and dashboard_measurement_groups)
    await queryRunner.createTable(
      new Table({
        name: 'dashboard_measurements',
        columns: [
          {
            name: 'id',
            type: this.getSerialType(queryRunner),
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'measurement_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'group_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'min_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'max_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      })
    );

    await queryRunner.createIndex(
      'dashboard_measurements',
      new TableIndex({
        name: 'IDX_dashboard_measurements_measurement_id',
        columnNames: ['measurement_id'],
      })
    );

    await queryRunner.createIndex(
      'dashboard_measurements',
      new TableIndex({
        name: 'IDX_dashboard_measurements_group_id',
        columnNames: ['group_id'],
      })
    );

    await queryRunner.createForeignKey(
      'dashboard_measurements',
      new TableForeignKey({
        columnNames: ['measurement_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'measurements',
        onDelete: 'CASCADE',
        name: 'FK_dashboard_measurements_measurement_id',
      })
    );

    await queryRunner.createForeignKey(
      'dashboard_measurements',
      new TableForeignKey({
        columnNames: ['group_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'dashboard_measurement_groups',
        onDelete: 'SET NULL',
        name: 'FK_dashboard_measurements_group_id',
      })
    );

    // Create sessions table (depends on users)
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'token',
            type: 'varchar',
            length: '500',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_SESSIONS_TOKEN',
        columnNames: ['token'],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_SESSIONS_USER_ID',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_SESSIONS_CREATED_AT',
        columnNames: ['created_at'],
      })
    );

    await queryRunner.createForeignKey(
      'sessions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_SESSIONS_USER_ID',
      })
    );

    // Create user_roles table (junction table - depends on users and roles)
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
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

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

    // Create role_permissions table (junction table - depends on roles and permissions)
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
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
        ],
      }),
      true
    );

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

    // Create alert_escalation_configs table (depends on devices and device_signals)
    await queryRunner.createTable(
      new Table({
        name: 'alert_escalation_configs',
        columns: [
          {
            name: 'id',
            type: this.getSerialType(queryRunner),
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'device_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'device_signal_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'endpoint_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
            default: "'http://localhost:1880/events'",
          },
          {
            name: 'warning_delay_minutes',
            type: 'integer',
            isNullable: false,
            default: '20',
          },
          {
            name: 'escalation1_delay_minutes',
            type: 'integer',
            isNullable: false,
            default: '40',
          },
          {
            name: 'escalation2_delay_minutes',
            type: 'integer',
            isNullable: false,
            default: '60',
          },
          {
            name: 'escalation3_delay_minutes',
            type: 'integer',
            isNullable: false,
            default: '80',
          },
          {
            name: 'is_active',
            type: this.getBooleanType(queryRunner),
            isNullable: false,
            default: this.isMSSQL(queryRunner) ? 1 : true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      })
    );

    await queryRunner.createIndex(
      'alert_escalation_configs',
      new TableIndex({
        name: 'IDX_alert_escalation_configs_device_signal',
        columnNames: ['device_id', 'device_signal_id'],
      })
    );

    await queryRunner.createForeignKey(
      'alert_escalation_configs',
      new TableForeignKey({
        columnNames: ['device_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'devices',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
        name: 'FK_alert_escalation_configs_device',
      })
    );

    await queryRunner.createForeignKey(
      'alert_escalation_configs',
      new TableForeignKey({
        columnNames: ['device_signal_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'device_signals',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
        name: 'FK_alert_escalation_configs_device_signal',
      })
    );

    // Create alert_escalation_messages table (depends on alert_escalation_configs)
    await queryRunner.createTable(
      new Table({
        name: 'alert_escalation_messages',
        columns: [
          {
            name: 'id',
            type: this.getSerialType(queryRunner),
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'escalation_config_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'level',
            ...(isMSSQL
              ? {
                  type: 'varchar',
                  length: '50',
                }
              : {
                  type: 'enum',
                  enum: ['alert', 'warning', 'escalation1', 'escalation2', 'escalation3', 'close'],
                }),
            isNullable: false,
          },
          {
            name: 'message_type',
            ...(isMSSQL
              ? {
                  type: 'varchar',
                  length: '50',
                }
              : {
                  type: 'enum',
                  enum: ['torreta', 'receptor', 'email'],
                }),
            isNullable: false,
          },
          {
            name: 'target_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'updated_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
            default: this.getTimestampDefault(queryRunner),
          },
          {
            name: 'deleted_at',
            type: this.getTimestampType(queryRunner),
            isNullable: true,
          },
        ],
      })
    );

    // Create enum CHECK constraints for SQL Server
    if (isMSSQL) {
      await this.createEnumCheckConstraint(
        queryRunner,
        'alert_escalation_messages',
        'level',
        ['alert', 'warning', 'escalation1', 'escalation2', 'escalation3', 'close'],
        'CK_alert_escalation_messages_level'
      );
      await this.createEnumCheckConstraint(
        queryRunner,
        'alert_escalation_messages',
        'message_type',
        ['torreta', 'receptor', 'email'],
        'CK_alert_escalation_messages_message_type'
      );
    }

    await queryRunner.createIndex(
      'alert_escalation_messages',
      new TableIndex({
        name: 'IDX_alert_escalation_messages_config_level',
        columnNames: ['escalation_config_id', 'level'],
      })
    );

    await queryRunner.createForeignKey(
      'alert_escalation_messages',
      new TableForeignKey({
        columnNames: ['escalation_config_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'alert_escalation_configs',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
        name: 'FK_alert_escalation_messages_config',
      })
    );

    // Create event_alert_logs table (depends on events)
    await queryRunner.createTable(
      new Table({
        name: 'event_alert_logs',
        columns: [
          {
            name: 'id',
            type: this.getSerialType(queryRunner),
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'event_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'level',
            ...(isMSSQL
              ? {
                  type: 'varchar',
                  length: '50',
                }
              : {
                  type: 'enum',
                  enum: ['alert', 'warning', 'escalation1', 'escalation2', 'escalation3', 'close'],
                }),
            isNullable: false,
          },
          {
            name: 'sent_at',
            type: this.getTimestampType(queryRunner),
            isNullable: false,
          },
          {
            name: 'messages_sent',
            ...(isMSSQL
              ? {
                  type: 'nvarchar',
                  length: 'max',
                }
              : {
                  type: 'jsonb',
                }),
            isNullable: false,
          },
          {
            name: 'success',
            type: this.getBooleanType(queryRunner),
            isNullable: false,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'endpoint_url',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
        ],
      })
    );

    // Create enum CHECK constraint for SQL Server
    if (isMSSQL) {
      await this.createEnumCheckConstraint(
        queryRunner,
        'event_alert_logs',
        'level',
        ['alert', 'warning', 'escalation1', 'escalation2', 'escalation3', 'close'],
        'CK_event_alert_logs_level'
      );
    }

    await queryRunner.createIndex(
      'event_alert_logs',
      new TableIndex({
        name: 'IDX_event_alert_logs_event_level',
        columnNames: ['event_id', 'level'],
      })
    );

    await queryRunner.createIndex(
      'event_alert_logs',
      new TableIndex({
        name: 'IDX_event_alert_logs_sent_at',
        columnNames: ['sent_at'],
      })
    );

    await queryRunner.createForeignKey(
      'event_alert_logs',
      new TableForeignKey({
        columnNames: ['event_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'events',
        onDelete: 'NO ACTION',
        onUpdate: 'NO ACTION',
        name: 'FK_event_alert_logs_event',
      })
    );

    // ============================================================================
    // STEP 4: Insert initial data (CRITICAL for system functionality)
    // ============================================================================

    // Insert permissions (56 records - CRITICAL)
    const modules = [
      'catalogs', // Unifies: areas, departments, torretas, torreta-colors, receptors, emails
      'devices',
      'measurements',
      'signals',
      'raw-measurements',
      'message-groups',
      'measurement-alerts', // Unifies: alert-rules, alert-messages
      'alert-triggers',
      'area-downtime',
      'area-torreta-config',
      'events',
      'users',
      'dashboard',
      'roles-and-permissions', // Unifies: roles, permissions
    ];

    const actions = ['create', 'read', 'update', 'delete'];

    const nowFunc = isMSSQL ? 'SYSDATETIMEOFFSET()' : 'NOW()';
    const onConflictSQL = isMSSQL 
      ? '' // SQL Server uses MERGE or IF NOT EXISTS pattern
      : 'ON CONFLICT (module, action) DO NOTHING';

    for (const module of modules) {
      for (const action of actions) {
        const description = `Permission to ${action} ${module}`;
        if (isMSSQL) {
          // SQL Server: Use IF NOT EXISTS with @0, @1, @2 placeholders
          await queryRunner.query(
            `IF NOT EXISTS (SELECT 1 FROM permissions WHERE module = @0 AND action = @1)
             INSERT INTO permissions (module, action, description, created_at, updated_at)
             VALUES (@0, @1, @2, ${nowFunc}, ${nowFunc})`,
            [module, action, description]
          );
        } else {
          // PostgreSQL
        await queryRunner.query(
          `INSERT INTO permissions (module, action, description, created_at, updated_at)
             VALUES ($1, $2, $3, ${nowFunc}, ${nowFunc})
             ${onConflictSQL}`,
          [module, action, description]
        );
        }
      }
    }

    // Insert message_groups (5 records - CRITICAL)
    if (isMSSQL) {
      await queryRunner.query(`
        IF NOT EXISTS (SELECT 1 FROM message_groups WHERE name = 'Alert')
          INSERT INTO message_groups (name, color, description, [order]) VALUES ('Alert', '#eab308', 'Alerta Amarilla', 1);
        IF NOT EXISTS (SELECT 1 FROM message_groups WHERE name = 'Warning')
          INSERT INTO message_groups (name, color, description, [order]) VALUES ('Warning', '#f97316', 'Advertencia Naranja', 2);
        IF NOT EXISTS (SELECT 1 FROM message_groups WHERE name = 'Critical')
          INSERT INTO message_groups (name, color, description, [order]) VALUES ('Critical', '#ef4444', 'Crítico Rojo', 3);
        IF NOT EXISTS (SELECT 1 FROM message_groups WHERE name = 'Final Escalation')
          INSERT INTO message_groups (name, color, description, [order]) VALUES ('Final Escalation', '#dc2626', 'Escalación Final Rojo Oscuro', 4);
        IF NOT EXISTS (SELECT 1 FROM message_groups WHERE name = 'Running')
          INSERT INTO message_groups (name, color, description, [order]) VALUES ('Running', '#22c55e', 'En Funcionamiento Verde', 5);
      `);
    } else {
    await queryRunner.query(`
      INSERT INTO message_groups (name, color, description, "order") VALUES
      ('Alert', '#eab308', 'Alerta Amarilla', 1),
      ('Warning', '#f97316', 'Advertencia Naranja', 2),
      ('Critical', '#ef4444', 'Crítico Rojo', 3),
      ('Final Escalation', '#dc2626', 'Escalación Final Rojo Oscuro', 4),
      ('Running', '#22c55e', 'En Funcionamiento Verde', 5)
      ON CONFLICT (name) DO NOTHING;
    `);
    }

    // Insert torreta_colors (8 records - IMPORTANT)
    if (isMSSQL) {
      await queryRunner.query(`
        IF NOT EXISTS (SELECT 1 FROM torreta_colors WHERE name = 'Rojo')
          INSERT INTO torreta_colors (name, html_color, device_color_id, [order]) VALUES ('Rojo', '#ef4444', 'R1', 1);
        IF NOT EXISTS (SELECT 1 FROM torreta_colors WHERE name = 'Verde')
          INSERT INTO torreta_colors (name, html_color, device_color_id, [order]) VALUES ('Verde', '#22c55e', 'G1', 2);
        IF NOT EXISTS (SELECT 1 FROM torreta_colors WHERE name = 'Azul')
          INSERT INTO torreta_colors (name, html_color, device_color_id, [order]) VALUES ('Azul', '#3b82f6', 'B1', 3);
        IF NOT EXISTS (SELECT 1 FROM torreta_colors WHERE name = 'Amarillo')
          INSERT INTO torreta_colors (name, html_color, device_color_id, [order]) VALUES ('Amarillo', '#eab308', 'Y1', 4);
        IF NOT EXISTS (SELECT 1 FROM torreta_colors WHERE name = 'Naranja')
          INSERT INTO torreta_colors (name, html_color, device_color_id, [order]) VALUES ('Naranja', '#f97316', 'O1', 5);
        IF NOT EXISTS (SELECT 1 FROM torreta_colors WHERE name = 'Morado')
          INSERT INTO torreta_colors (name, html_color, device_color_id, [order]) VALUES ('Morado', '#a855f7', 'P1', 6);
        IF NOT EXISTS (SELECT 1 FROM torreta_colors WHERE name = 'Rosa')
          INSERT INTO torreta_colors (name, html_color, device_color_id, [order]) VALUES ('Rosa', '#ec4899', 'PK1', 7);
        IF NOT EXISTS (SELECT 1 FROM torreta_colors WHERE name = 'Blanco')
          INSERT INTO torreta_colors (name, html_color, device_color_id, [order]) VALUES ('Blanco', '#ffffff', 'W1', 8);
      `);
    } else {
    await queryRunner.query(`
      INSERT INTO torreta_colors (name, html_color, device_color_id, "order") VALUES
      ('Rojo', '#ef4444', 'R1', 1),
      ('Verde', '#22c55e', 'G1', 2),
      ('Azul', '#3b82f6', 'B1', 3),
      ('Amarillo', '#eab308', 'Y1', 4),
      ('Naranja', '#f97316', 'O1', 5),
      ('Morado', '#a855f7', 'P1', 6),
      ('Rosa', '#ec4899', 'PK1', 7),
      ('Blanco', '#ffffff', 'W1', 8)
      ON CONFLICT (name) DO NOTHING;
    `);
    }

    // ============================================================================
    // STEP 5: Create CHECK constraints for ENUMs in SQL Server
    // ============================================================================
    
    if (isMSSQL) {
      // Create CHECK constraints for enum columns in SQL Server
      await this.createEnumCheckConstraint(
        queryRunner,
        'measurements',
        'type',
        ['temperature', 'humidity', 'pressure', 'level', 'flow', 'vibration'],
        'CK_measurements_type'
      );

      await this.createEnumCheckConstraint(
        queryRunner,
        'events',
        'status',
        ['open', 'in-progress', 'closed'],
        'CK_events_status'
      );

      await this.createEnumCheckConstraint(
        queryRunner,
        'alert_rules',
        'mode',
        ['setpoint', 'window'],
        'CK_alert_rules_mode'
      );

      await this.createEnumCheckConstraint(
        queryRunner,
        'alert_messages',
        'receptor_type',
        ['telegram', 'torreta', 'correo', 'receptor'],
        'CK_alert_messages_receptor_type'
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign key dependencies)

    // Drop junction tables first
    await queryRunner.dropTable('role_permissions');
    await queryRunner.dropTable('user_roles');

    // Drop tables with foreign keys
    await queryRunner.dropTable('event_alert_logs');
    await queryRunner.dropTable('alert_escalation_messages');
    await queryRunner.dropTable('alert_escalation_configs');
    await queryRunner.dropTable('sessions');
    await queryRunner.dropTable('dashboard_measurements');
    await queryRunner.dropTable('dashboard_measurement_groups');
    await queryRunner.dropTable('area_torreta_configs');
    await queryRunner.dropTable('area_downtime_events');
    await queryRunner.dropTable('area_downtimes');
    await queryRunner.dropTable('events');
    await queryRunner.dropTable('alert_triggers');
    await queryRunner.dropTable('alert_messages');
    await queryRunner.dropTable('alert_rules');
    await queryRunner.dropTable('measurement_values');
    await queryRunner.dropTable('device_signals');
    await queryRunner.dropTable('devices');

    // Drop base tables
    await queryRunner.dropTable('roles');
    await queryRunner.dropTable('permissions');
    await queryRunner.dropTable('users');
    await queryRunner.dropTable('raw_measurements');
    await queryRunner.dropTable('processed_signals');
    await queryRunner.dropTable('raw_signals');
    await queryRunner.dropTable('measurements');
    await queryRunner.dropTable('message_groups');
    await queryRunner.dropTable('emails');
    await queryRunner.dropTable('receptors');
    await queryRunner.dropTable('torreta_colors');
    await queryRunner.dropTable('torretas');
    await queryRunner.dropTable('departments');
    await queryRunner.dropTable('areas');

    // Drop enum types (PostgreSQL) or CHECK constraints (SQL Server)
    const isMSSQL = this.isMSSQL(queryRunner);
    
    if (isMSSQL) {
      // Drop CHECK constraints for SQL Server
      await queryRunner.query(
        `IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_measurements_type')
         ALTER TABLE measurements DROP CONSTRAINT CK_measurements_type;`
      );
      await queryRunner.query(
        `IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_events_status')
         ALTER TABLE events DROP CONSTRAINT CK_events_status;`
      );
      await queryRunner.query(
        `IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_alert_rules_mode')
         ALTER TABLE alert_rules DROP CONSTRAINT CK_alert_rules_mode;`
      );
      await queryRunner.query(
        `IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_alert_messages_receptor_type')
         ALTER TABLE alert_messages DROP CONSTRAINT CK_alert_messages_receptor_type;`
      );
      // Add more CHECK constraints drops if needed for other enum columns
    } else {
      // Drop ENUM types for PostgreSQL
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."event_alert_logs_level_enum"`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."alert_escalation_messages_message_type_enum"`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."alert_escalation_messages_level_enum"`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."area_torreta_configs_configuration_type_enum"`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."alert_messages_receptor_type_enum"`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."alert_rules_mode_enum"`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."events_status_enum"`
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."measurements_type_enum"`
    );
    }
  }
}

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
 */
export class InitialSchema1000000000000 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // STEP 1: Create ENUM types (must be created before tables that use them)
    // ============================================================================

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
            type: 'boolean',
            isNullable: false,
            default: true,
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
            type: 'boolean',
            isNullable: false,
            default: true,
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
            type: 'enum',
            enum: [
              'temperature',
              'humidity',
              'pressure',
              'level',
              'flow',
              'vibration',
            ],
            isNullable: false,
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
            type: 'boolean',
            isNullable: false,
            default: false,
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

    // Create partial unique index on roles.name (only for non-deleted roles)
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
            type: 'boolean',
            isNullable: false,
            default: false,
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
        onDelete: 'RESTRICT',
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
        onDelete: 'RESTRICT',
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
        onDelete: 'RESTRICT',
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
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
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
            type: 'enum',
            enum: ['setpoint', 'window'],
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
            type: 'boolean',
            isNullable: false,
            default: true,
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
            type: 'enum',
            enum: ['telegram', 'torreta', 'correo', 'receptor'],
            isNullable: false,
          },
          {
            name: 'message_data',
            type: 'jsonb',
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
        onDelete: 'RESTRICT',
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
            type: 'enum',
            enum: ['open', 'in-progress', 'closed'],
            isNullable: false,
            default: "'open'",
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
            name: 'in_progress_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'closed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'duration_seconds',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'virtual_device',
            type: 'boolean',
            isNullable: false,
            default: false,
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
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'timestamp with time zone',
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
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "area_torreta_configs" (
        "id" SERIAL NOT NULL,
        "area_id" integer NOT NULL,
        "torreta_external_id" character varying(255) NOT NULL,
        "configuration_type" "public"."area_torreta_configs_configuration_type_enum" NOT NULL DEFAULT 'area',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_area_torreta_configs" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_area_torreta_configs_area_id_torreta_external_id" 
      ON "area_torreta_configs" ("area_id", "torreta_external_id");
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "area_torreta_configs"
        ADD CONSTRAINT "FK_area_torreta_configs_area_id"
        FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create dashboard_measurement_groups table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS dashboard_measurement_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_dashboard_measurement_groups_name
      ON dashboard_measurement_groups (name);
    `);

    // Create dashboard_measurements table (depends on measurements and dashboard_measurement_groups)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS dashboard_measurements (
        id SERIAL PRIMARY KEY,
        measurement_id INTEGER NOT NULL,
        group_id INTEGER NULL,
        min_value DECIMAL(10, 2) NOT NULL,
        max_value DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE NULL,
        CONSTRAINT FK_dashboard_measurements_measurement_id
          FOREIGN KEY (measurement_id)
          REFERENCES measurements(id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_dashboard_measurements_measurement_id
      ON dashboard_measurements (measurement_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_dashboard_measurements_group_id
      ON dashboard_measurements (group_id);
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE dashboard_measurements
        ADD CONSTRAINT FK_dashboard_measurements_group_id
          FOREIGN KEY (group_id)
          REFERENCES dashboard_measurement_groups(id)
          ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

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
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
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
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
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
            type: 'timestamp with time zone',
            isNullable: false,
            default: 'now()',
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
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alert_escalation_configs" (
        "id" SERIAL NOT NULL,
        "device_id" integer NOT NULL,
        "device_signal_id" integer NOT NULL,
        "endpoint_url" character varying(500) NOT NULL DEFAULT 'http://host.docker.internal:1880/events',
        "warning_delay_minutes" integer NOT NULL DEFAULT '20',
        "escalation1_delay_minutes" integer NOT NULL DEFAULT '40',
        "escalation2_delay_minutes" integer NOT NULL DEFAULT '60',
        "escalation3_delay_minutes" integer NOT NULL DEFAULT '80',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_alert_escalation_configs" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alert_escalation_configs_device_signal" 
      ON "alert_escalation_configs" ("device_id", "device_signal_id");
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "alert_escalation_configs" 
        ADD CONSTRAINT "FK_alert_escalation_configs_device" 
        FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "alert_escalation_configs" 
        ADD CONSTRAINT "FK_alert_escalation_configs_device_signal" 
        FOREIGN KEY ("device_signal_id") REFERENCES "device_signals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create alert_escalation_messages table (depends on alert_escalation_configs)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alert_escalation_messages" (
        "id" SERIAL NOT NULL,
        "escalation_config_id" integer NOT NULL,
        "level" "public"."alert_escalation_messages_level_enum" NOT NULL,
        "message_type" "public"."alert_escalation_messages_message_type_enum" NOT NULL,
        "target_id" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "color" character varying(7),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_alert_escalation_messages" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alert_escalation_messages_config_level" 
      ON "alert_escalation_messages" ("escalation_config_id", "level");
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "alert_escalation_messages" 
        ADD CONSTRAINT "FK_alert_escalation_messages_config" 
        FOREIGN KEY ("escalation_config_id") REFERENCES "alert_escalation_configs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create event_alert_logs table (depends on events)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_alert_logs" (
        "id" SERIAL NOT NULL,
        "event_id" integer NOT NULL,
        "level" "public"."event_alert_logs_level_enum" NOT NULL,
        "sent_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "messages_sent" jsonb NOT NULL,
        "success" boolean NOT NULL,
        "error_message" text,
        "endpoint_url" character varying(500) NOT NULL,
        CONSTRAINT "PK_event_alert_logs" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_alert_logs_event_level" 
      ON "event_alert_logs" ("event_id", "level");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_alert_logs_sent_at" 
      ON "event_alert_logs" ("sent_at");
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "event_alert_logs" 
        ADD CONSTRAINT "FK_event_alert_logs_event" 
        FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

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

    for (const module of modules) {
      for (const action of actions) {
        const description = `Permission to ${action} ${module}`;
        await queryRunner.query(
          `INSERT INTO permissions (module, action, description, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (module, action) DO NOTHING`,
          [module, action, description]
        );
      }
    }

    // Insert message_groups (5 records - CRITICAL)
    await queryRunner.query(`
      INSERT INTO message_groups (name, color, description, "order") VALUES
      ('Alert', '#eab308', 'Alerta Amarilla', 1),
      ('Warning', '#f97316', 'Advertencia Naranja', 2),
      ('Critical', '#ef4444', 'Crítico Rojo', 3),
      ('Final Escalation', '#dc2626', 'Escalación Final Rojo Oscuro', 4),
      ('Running', '#22c55e', 'En Funcionamiento Verde', 5)
      ON CONFLICT (name) DO NOTHING;
    `);

    // Insert torreta_colors (8 records - IMPORTANT)
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

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."event_alert_logs_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."alert_escalation_messages_message_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."alert_escalation_messages_level_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."area_torreta_configs_configuration_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."alert_messages_receptor_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."alert_rules_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."events_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."measurements_type_enum"`);
  }
}


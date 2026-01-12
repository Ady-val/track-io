import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAlertMessagesStructure1767374122229
  implements MigrationInterface
{
  name = 'RefactorAlertMessagesStructure1767374122229';

  private isMSSQL(queryRunner: QueryRunner): boolean {
    return queryRunner.connection.options.type === 'mssql';
  }

  private async columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
    const isMSSQL = this.isMSSQL(queryRunner);
    
    if (isMSSQL) {
      const result = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.columns
        WHERE object_id = OBJECT_ID(@0)
        AND name = @1;
      `, [tableName, columnName]);
      return result[0].count > 0;
    } else {
      const result = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = $1 
          AND column_name = $2
        );
      `, [tableName, columnName]);
      return result[0].exists;
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    // Check if alert_messages table exists
    let tableExists = false;
    if (isMSSQL) {
      const tableCheck = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.tables 
        WHERE name = 'alert_messages';
      `);
      tableExists = tableCheck[0].count > 0;
    } else {
      const tableCheck = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'alert_messages'
        );
      `);
      tableExists = tableCheck[0].exists;
    }

    if (!tableExists) {
      // Table doesn't exist yet, skip this migration
      return;
    }

    if (isMSSQL) {
      // SQL Server: Check if new columns already exist (they should from InitialSchema)
      const columnsCheck = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.columns
        WHERE object_id = OBJECT_ID('alert_messages')
        AND name IN ('message_type', 'target_id', 'message', 'color');
      `);

      // If all new columns exist, this migration was already applied or InitialSchema created them
      if (columnsCheck[0].count >= 4) {
        // Check if old columns exist
        const oldColumnsCheck = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM sys.columns
          WHERE object_id = OBJECT_ID('alert_messages')
          AND name IN ('receptor_type', 'message_data');
        `);

        // If old columns don't exist, migration is complete
        if (oldColumnsCheck[0].count === 0) {
          return;
        }
      }

      // Add new columns if they don't exist
      await queryRunner.query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('alert_messages') AND name = 'message_type')
          ALTER TABLE alert_messages ADD message_type VARCHAR(50) NULL;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('alert_messages') AND name = 'target_id')
          ALTER TABLE alert_messages ADD target_id VARCHAR(255) NULL;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('alert_messages') AND name = 'message')
          ALTER TABLE alert_messages ADD message TEXT NULL;
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('alert_messages') AND name = 'color')
          ALTER TABLE alert_messages ADD color VARCHAR(10) NULL;
      `);

      // Create CHECK constraint for message_type if it doesn't exist
      const constraintCheck = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM sys.check_constraints
        WHERE name = 'CK_alert_messages_message_type'
        AND parent_object_id = OBJECT_ID('alert_messages');
      `);

      if (constraintCheck[0].count === 0) {
        await queryRunner.query(`
          ALTER TABLE alert_messages ADD CONSTRAINT CK_alert_messages_message_type
          CHECK (message_type IN ('torreta', 'receptor', 'email'));
        `);
      }
    } else {
      // PostgreSQL: Step 1: Create message_type enum if it doesn't exist (reuse from escalation)
      const messageTypeEnumExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM pg_type WHERE typname = 'alert_messages_message_type_enum'
        );
      `);

      if (!messageTypeEnumExists[0]?.exists) {
        await queryRunner.query(`
          CREATE TYPE "public"."alert_messages_message_type_enum" AS ENUM('torreta', 'receptor', 'email')
        `);
      }

      // Step 2: Add new columns
      await queryRunner.query(`
        ALTER TABLE "alert_messages"
        ADD COLUMN IF NOT EXISTS "message_type" "public"."alert_messages_message_type_enum",
        ADD COLUMN IF NOT EXISTS "target_id" character varying(255),
        ADD COLUMN IF NOT EXISTS "message" text,
        ADD COLUMN IF NOT EXISTS "color" character varying(10)
      `);
    }

    // Step 3: Migrate data from JSONB to new columns
    // First, check if old columns exist (they might have been removed by TypeORM sync)
    let hasReceptorType = false;
    let hasMessageData = false;

    if (isMSSQL) {
      // SQL Server: Check if old columns exist
      const oldColumnsCheck = await queryRunner.query(`
        SELECT 
          CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('alert_messages') AND name = 'receptor_type') THEN 1 ELSE 0 END as receptor_type_exists,
          CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('alert_messages') AND name = 'message_data') THEN 1 ELSE 0 END as message_data_exists;
      `);
      hasReceptorType = oldColumnsCheck[0]?.receptor_type_exists === 1;
      hasMessageData = oldColumnsCheck[0]?.message_data_exists === 1;
    } else {
      // PostgreSQL: Check if old columns exist
      const oldColumnsExist = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'alert_messages' 
          AND column_name = 'receptor_type'
        ) as receptor_type_exists,
        EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'alert_messages' 
          AND column_name = 'message_data'
        ) as message_data_exists
      `);
      hasReceptorType = oldColumnsExist[0]?.receptor_type_exists;
      hasMessageData = oldColumnsExist[0]?.message_data_exists;
    }

    // For SQL Server: If old columns don't exist, skip data migration (new database)
    if (isMSSQL && !hasReceptorType && !hasMessageData) {
      // New SQL Server database - columns are already created by InitialSchema
      // Skip data migration and proceed to set NOT NULL constraints
    } else if (hasReceptorType || hasMessageData) {
      // Migrate data if at least one old column exists
      // This handles cases where TypeORM sync may have already removed one column
      // Build SELECT query based on which columns exist
      const selectColumns: string[] = ['id'];
      if (hasReceptorType) selectColumns.push('receptor_type');
      if (hasMessageData) selectColumns.push('message_data');

      // Build WHERE clause - only filter by message_data if it exists
      let whereClause = '';
      if (hasMessageData) {
        whereClause = 'WHERE message_data IS NOT NULL';
      } else if (hasReceptorType) {
        // If only receptor_type exists, migrate all rows with a receptor_type
        whereClause = 'WHERE receptor_type IS NOT NULL';
      }

      // First, get all alert messages with their available data
      const messages = await queryRunner.query(`
        SELECT ${selectColumns.join(', ')}
        FROM alert_messages
        ${whereClause}
      `);

      for (const msg of messages) {
        const { id } = msg;
        const receptor_type = hasReceptorType ? msg.receptor_type : null;
        const message_data = hasMessageData ? msg.message_data : null;

        let messageType: string | null = null;
        let targetId: string | null = null;
        let message: string | null = null;
        let color: string | null = null;

        // Map receptor_type to messageType (only if receptor_type exists)
        if (!receptor_type) {
          // If receptor_type doesn't exist, we can't determine the message type
          // Skip this row as we don't have enough information to migrate
          continue;
        }

        switch (receptor_type) {
          case 'torreta':
            messageType = 'torreta';
            if (message_data?.torreta?.torretaId) {
              // Get externalId from torretas table
              const torretaResult = await queryRunner.query(
                isMSSQL
                  ? `SELECT external_id FROM torretas WHERE id = @0 AND deleted_at IS NULL`
                  : `SELECT external_id FROM torretas WHERE id = $1 AND deleted_at IS NULL`,
                [message_data.torreta.torretaId]
              );
              if (torretaResult.length > 0 && torretaResult[0].external_id) {
                targetId = torretaResult[0].external_id;
              }
            }
            if (message_data?.torreta?.colorId) {
              // Get deviceColorId from torreta_colors table
              const colorResult = await queryRunner.query(
                isMSSQL
                  ? `SELECT device_color_id FROM torreta_colors WHERE id = @0`
                  : `SELECT device_color_id FROM torreta_colors WHERE id = $1`,
                [message_data.torreta.colorId]
              );
              if (colorResult.length > 0 && colorResult[0].device_color_id) {
                color = colorResult[0].device_color_id;
              }
            }
            break;

          case 'receptor':
            messageType = 'receptor';
            if (message_data?.receptor?.receptorId) {
              // Get externalId from receptors table
              const receptorResult = await queryRunner.query(
                isMSSQL
                  ? `SELECT external_id FROM receptors WHERE id = @0 AND deleted_at IS NULL`
                  : `SELECT external_id FROM receptors WHERE id = $1 AND deleted_at IS NULL`,
                [message_data.receptor.receptorId]
              );
              if (receptorResult.length > 0 && receptorResult[0].external_id) {
                targetId = receptorResult[0].external_id;
              }
            }
            if (message_data?.receptor?.message) {
              message = message_data.receptor.message;
            }
            break;

          case 'correo':
            messageType = 'email';
            if (
              message_data?.correo?.emails &&
              message_data.correo.emails.length > 0
            ) {
              targetId = message_data.correo.emails[0];
            }
            if (message_data?.correo?.message) {
              message = message_data.correo.message;
            }
            break;

          case 'telegram':
            // Skip telegram messages as they're not used in escalation
            continue;
        }

        // Update the row with migrated data
        if (messageType) {
          await queryRunner.query(
            isMSSQL
              ? `UPDATE alert_messages SET message_type = @0, target_id = @1, message = @2, color = @3 WHERE id = @4`
              : `UPDATE alert_messages SET message_type = $1, target_id = $2, message = $3, color = $4 WHERE id = $5`,
            [messageType, targetId, message, color, id]
          );
        }
      }
    }

    // Step 4: Check for NULL values before setting NOT NULL
    // If old columns don't exist and we couldn't migrate, there may be NULL values
    // We need to handle them before setting NOT NULL constraints
    const nullRowsCheck = await queryRunner.query(`
      SELECT COUNT(*) as null_count
      FROM alert_messages
      WHERE message_type IS NULL 
         OR target_id IS NULL 
         OR message IS NULL
    `);

    const nullCount = parseInt(nullRowsCheck[0]?.null_count || '0', 10);

    if (nullCount > 0) {
      // If we couldn't migrate (old columns don't exist), these rows are orphaned/invalid
      // Delete them as they can't be properly migrated
      if (!hasReceptorType && !hasMessageData) {
        await queryRunner.query(`
          DELETE FROM alert_messages
          WHERE message_type IS NULL 
             OR target_id IS NULL 
             OR message IS NULL
        `);
      } else {
        // If old columns exist but we still have NULLs, something went wrong
        // Don't set NOT NULL - this indicates a migration issue that needs manual intervention
        throw new Error(
          `Cannot set NOT NULL constraints: ${nullCount} rows have NULL values in message_type, target_id, or message columns. ` +
            `Please review and fix these rows before running the migration again.`
        );
      }
    }

    // Step 5: Make new columns NOT NULL (after migration and cleanup)
    // Check if columns exist and are nullable before making them NOT NULL
    let newColumnsInfo: any[] = [];
    if (isMSSQL) {
      newColumnsInfo = await queryRunner.query(`
        SELECT 
          name as column_name,
          is_nullable
        FROM sys.columns
        WHERE object_id = OBJECT_ID('alert_messages')
        AND name IN ('message_type', 'target_id', 'message');
      `);
    } else {
      newColumnsInfo = await queryRunner.query(`
        SELECT 
          column_name,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'alert_messages' 
        AND column_name IN ('message_type', 'target_id', 'message');
      `);
    }

    const columnsToMakeNotNull: string[] = [];
    for (const col of newColumnsInfo) {
      if ((isMSSQL && col.is_nullable === 1) || (!isMSSQL && col.is_nullable === 'YES')) {
        columnsToMakeNotNull.push(col.column_name);
      }
    }

    if (columnsToMakeNotNull.length > 0) {
      // Double-check that no NULL values remain before setting NOT NULL
      const finalNullCheck = await queryRunner.query(`
        SELECT COUNT(*) as null_count
        FROM alert_messages
        WHERE message_type IS NULL 
           OR target_id IS NULL 
           OR message IS NULL
      `);

      const finalNullCount = parseInt(finalNullCheck[0]?.null_count || '0', 10);
      if (finalNullCount > 0) {
        throw new Error(
          `Cannot set NOT NULL constraints: ${finalNullCount} rows still have NULL values. ` +
            `This should not happen after cleanup. Please investigate.`
        );
      }

      if (isMSSQL) {
        // SQL Server: Alter columns one by one
        for (const col of columnsToMakeNotNull) {
          await queryRunner.query(`
            ALTER TABLE alert_messages
            ALTER COLUMN [${col}] VARCHAR(${col === 'message_type' ? '50' : col === 'target_id' ? '255' : 'MAX'}) NOT NULL;
          `);
        }
      } else {
        // PostgreSQL: Alter columns together
        const alterStatements = columnsToMakeNotNull.map(
          col => `ALTER COLUMN "${col}" SET NOT NULL`
        );
        await queryRunner.query(`
          ALTER TABLE "alert_messages"
          ${alterStatements.join(',\n        ')}
        `);
      }
    }

    // Step 6: Drop old columns and enum (only drop columns that actually exist)
    if (hasReceptorType) {
      if (isMSSQL) {
        // SQL Server: Drop ALL dependent objects first, then column
        
        // 1. Drop indexes that reference the column
        const indexes = await queryRunner.query(`
          SELECT DISTINCT i.name as index_name
          FROM sys.indexes i
          INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE i.object_id = OBJECT_ID('alert_messages')
          AND c.name = 'receptor_type'
          AND i.name IS NOT NULL;
        `);

        for (const idx of indexes) {
          await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.indexes WHERE name = '${idx.index_name}' AND object_id = OBJECT_ID('alert_messages'))
              DROP INDEX [${idx.index_name}] ON alert_messages;
          `);
        }

        // 2. Drop CHECK constraints that reference the column
        // First, try to drop the known constraint name from InitialSchema
        await queryRunner.query(`
          IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_alert_messages_receptor_type' AND parent_object_id = OBJECT_ID('alert_messages'))
            ALTER TABLE alert_messages DROP CONSTRAINT CK_alert_messages_receptor_type;
        `);

        // Also check for any other CHECK constraints that reference the column
        const checkConstraints = await queryRunner.query(`
          SELECT DISTINCT cc.name as constraint_name
          FROM sys.check_constraints cc
          WHERE cc.parent_object_id = OBJECT_ID('alert_messages')
          AND (
            -- Direct column reference
            EXISTS (
              SELECT 1 FROM sys.columns c 
              WHERE c.object_id = cc.parent_object_id 
              AND c.column_id = cc.parent_column_id 
              AND c.name = 'receptor_type'
            )
            -- Or constraint definition contains the column name
            OR cc.definition LIKE '%receptor_type%'
          )
          AND cc.name != 'CK_alert_messages_receptor_type'; -- Already dropped above
        `);

        for (const constraint of checkConstraints) {
          await queryRunner.query(`
            ALTER TABLE alert_messages DROP CONSTRAINT [${constraint.constraint_name}];
          `);
        }

        // 3. Drop default constraints
        const defaultConstraints = await queryRunner.query(`
          SELECT dc.name as constraint_name
          FROM sys.default_constraints dc
          INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
          WHERE dc.parent_object_id = OBJECT_ID('alert_messages')
          AND c.name = 'receptor_type';
        `);

        for (const constraint of defaultConstraints) {
          await queryRunner.query(`
            ALTER TABLE alert_messages DROP CONSTRAINT [${constraint.constraint_name}];
          `);
        }

        // 4. Now drop the column
        await queryRunner.query(`
          ALTER TABLE alert_messages DROP COLUMN receptor_type;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE "alert_messages" DROP COLUMN IF EXISTS "receptor_type";
        `);
      }
    }

    if (hasMessageData) {
      if (isMSSQL) {
        // SQL Server: Drop ALL dependent objects first, then column
        
        // 1. Drop indexes that reference the column
        const indexes = await queryRunner.query(`
          SELECT DISTINCT i.name as index_name
          FROM sys.indexes i
          INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
          INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
          WHERE i.object_id = OBJECT_ID('alert_messages')
          AND c.name = 'message_data'
          AND i.name IS NOT NULL;
        `);

        for (const idx of indexes) {
          await queryRunner.query(`
            IF EXISTS (SELECT * FROM sys.indexes WHERE name = '${idx.index_name}' AND object_id = OBJECT_ID('alert_messages'))
              DROP INDEX [${idx.index_name}] ON alert_messages;
          `);
        }

        // 2. Drop CHECK constraints that reference the column
        // Note: CHECK constraints in SQL Server can reference columns but parent_column_id might be NULL
        const checkConstraints = await queryRunner.query(`
          SELECT DISTINCT cc.name as constraint_name
          FROM sys.check_constraints cc
          WHERE cc.parent_object_id = OBJECT_ID('alert_messages')
          AND (
            -- Direct column reference
            EXISTS (
              SELECT 1 FROM sys.columns c 
              WHERE c.object_id = cc.parent_object_id 
              AND c.column_id = cc.parent_column_id 
              AND c.name = 'message_data'
            )
            -- Or constraint definition contains the column name
            OR cc.definition LIKE '%message_data%'
          );
        `);

        for (const constraint of checkConstraints) {
          await queryRunner.query(`
            ALTER TABLE alert_messages DROP CONSTRAINT [${constraint.constraint_name}];
          `);
        }

        // 3. Drop default constraints
        const defaultConstraints = await queryRunner.query(`
          SELECT dc.name as constraint_name
          FROM sys.default_constraints dc
          INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
          WHERE dc.parent_object_id = OBJECT_ID('alert_messages')
          AND c.name = 'message_data';
        `);

        for (const constraint of defaultConstraints) {
          await queryRunner.query(`
            ALTER TABLE alert_messages DROP CONSTRAINT [${constraint.constraint_name}];
          `);
        }

        // 4. Now drop the column
        await queryRunner.query(`
          ALTER TABLE alert_messages DROP COLUMN message_data;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE "alert_messages" DROP COLUMN IF EXISTS "message_data";
        `);
      }
    }

    // Drop old enum if no other tables use it (PostgreSQL only)
    if (!isMSSQL) {
      await queryRunner.query(`
        DROP TYPE IF EXISTS "public"."alert_messages_receptor_type_enum";
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const isMSSQL = this.isMSSQL(queryRunner);

    // Check if columns already exist
    const hasReceptorType = await this.columnExists(queryRunner, 'alert_messages', 'receptor_type');
    const hasMessageData = await this.columnExists(queryRunner, 'alert_messages', 'message_data');

    if (!isMSSQL && !hasReceptorType) {
      // Recreate old enum (PostgreSQL only)
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "public"."alert_messages_receptor_type_enum" AS ENUM(
            'telegram', 'torreta', 'correo', 'receptor'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    }

    // Add back old columns
    if (!hasReceptorType) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE alert_messages
          ADD receptor_type VARCHAR(50) NULL;
        `);
        // Add CHECK constraint
        await queryRunner.query(`
          ALTER TABLE alert_messages ADD CONSTRAINT CK_alert_messages_receptor_type
          CHECK (receptor_type IN ('telegram', 'torreta', 'correo', 'receptor'));
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE "alert_messages"
          ADD COLUMN IF NOT EXISTS "receptor_type" "public"."alert_messages_receptor_type_enum";
        `);
      }
    }

    if (!hasMessageData) {
      if (isMSSQL) {
        await queryRunner.query(`
          ALTER TABLE alert_messages
          ADD message_data NVARCHAR(MAX) NULL;
        `);
      } else {
        await queryRunner.query(`
          ALTER TABLE "alert_messages"
          ADD COLUMN IF NOT EXISTS "message_data" jsonb;
        `);
      }
    }

    // Migrate data back (simplified - may lose some data)
    const messages = await queryRunner.query(`
      SELECT id, message_type, target_id, message, color
      FROM alert_messages
      WHERE message_type IS NOT NULL
    `);

    for (const msg of messages) {
      const { id, message_type, target_id, message, color } = msg;
      let receptorType: string | null = null;
      let messageData: any = null;

      switch (message_type) {
        case 'torreta':
          receptorType = 'torreta';
          const torretaResult = await queryRunner.query(
            isMSSQL
              ? `SELECT TOP 1 id FROM torretas WHERE external_id = @0 AND deleted_at IS NULL`
              : `SELECT id FROM torretas WHERE external_id = $1 AND deleted_at IS NULL LIMIT 1`,
            [target_id]
          );
          const colorResult = await queryRunner.query(
            isMSSQL
              ? `SELECT TOP 1 id FROM torreta_colors WHERE device_color_id = @0`
              : `SELECT id FROM torreta_colors WHERE device_color_id = $1 LIMIT 1`,
            [color || '']
          );

          messageData = {
            torreta: {
              torretaId: torretaResult.length > 0 ? torretaResult[0].id : null,
              colorId: colorResult.length > 0 ? colorResult[0].id : null,
            },
          };
          break;

        case 'receptor':
          receptorType = 'receptor';
          let receptorId: string | null = null;
          const result = await queryRunner.query(
            isMSSQL
              ? `SELECT TOP 1 id FROM receptors WHERE external_id = @0 AND deleted_at IS NULL`
              : `SELECT id FROM receptors WHERE external_id = $1 AND deleted_at IS NULL LIMIT 1`,
            [target_id]
          );
          receptorId = result.length > 0 ? result[0].id : null;

          messageData = {
            receptor: {
              receptorId: receptorId,
              message: message || '',
            },
          };
          break;

        case 'email':
          receptorType = 'correo';
          messageData = {
            correo: {
              emails: [target_id || ''],
              subject: 'Alerta',
              message: message || '',
            },
          };
          break;
      }

      if (receptorType && messageData) {
        await queryRunner.query(
          isMSSQL
            ? `UPDATE alert_messages SET receptor_type = @0, message_data = @1 WHERE id = @2`
            : `UPDATE alert_messages SET receptor_type = $1, message_data = $2 WHERE id = $3`,
          [receptorType, JSON.stringify(messageData), id]
        );
      }
    }

    // Make old columns NOT NULL
    if (isMSSQL) {
      // SQL Server: Alter columns one by one
      await queryRunner.query(`
        ALTER TABLE alert_messages
        ALTER COLUMN receptor_type VARCHAR(50) NOT NULL;
      `);
      await queryRunner.query(`
        ALTER TABLE alert_messages
        ALTER COLUMN message_data NVARCHAR(MAX) NOT NULL;
      `);
    } else {
      // PostgreSQL: Alter columns together
      await queryRunner.query(`
        ALTER TABLE "alert_messages"
        ALTER COLUMN "receptor_type" SET NOT NULL,
        ALTER COLUMN "message_data" SET NOT NULL;
      `);
    }

    // Drop new columns
    const columnsToDrop = ['message_type', 'target_id', 'message', 'color'];
    for (const col of columnsToDrop) {
      if (await this.columnExists(queryRunner, 'alert_messages', col)) {
        if (isMSSQL) {
          // SQL Server: Drop dependent objects first
          const indexes = await queryRunner.query(`
            SELECT i.name as index_name
            FROM sys.indexes i
            INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE i.object_id = OBJECT_ID('alert_messages')
            AND c.name = @0
            AND i.name IS NOT NULL;
          `, [col]);

          for (const idx of indexes) {
            await queryRunner.query(`
              DROP INDEX IF EXISTS [${idx.index_name}] ON alert_messages;
            `);
          }

          await queryRunner.query(`
            ALTER TABLE alert_messages DROP COLUMN [${col}];
          `);
        } else {
          await queryRunner.query(`
            ALTER TABLE "alert_messages" DROP COLUMN IF EXISTS "${col}";
          `);
        }
      }
    }

    // Drop new enum (PostgreSQL only)
    if (!isMSSQL) {
      await queryRunner.query(`
        DROP TYPE IF EXISTS "public"."alert_messages_message_type_enum";
      `);
    }
  }
}

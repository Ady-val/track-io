import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAlertMessagesStructure1767374122229
  implements MigrationInterface
{
  name = 'RefactorAlertMessagesStructure1767374122229';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Create message_type enum if it doesn't exist (reuse from escalation)
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

    // Step 3: Migrate data from JSONB to new columns
    // First, get all alert messages with their message_data
    const messages = await queryRunner.query(`
      SELECT id, receptor_type, message_data
      FROM alert_messages
      WHERE message_data IS NOT NULL
    `);

    for (const msg of messages) {
      const { id, receptor_type, message_data } = msg;
      let messageType: string | null = null;
      let targetId: string | null = null;
      let message: string | null = null;
      let color: string | null = null;

      // Map receptor_type to messageType
      switch (receptor_type) {
        case 'torreta':
          messageType = 'torreta';
          if (message_data?.torreta?.torretaId) {
            // Get externalId from torretas table
            const torretaResult = await queryRunner.query(
              `
              SELECT external_id FROM torretas WHERE id = $1 AND deleted_at IS NULL
            `,
              [message_data.torreta.torretaId]
            );
            if (torretaResult.length > 0 && torretaResult[0].external_id) {
              targetId = torretaResult[0].external_id;
            }
          }
          if (message_data?.torreta?.colorId) {
            // Get deviceColorId from torreta_colors table
            const colorResult = await queryRunner.query(
              `
              SELECT device_color_id FROM torreta_colors WHERE id = $1
            `,
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
              `
              SELECT external_id FROM receptors WHERE id = $1 AND deleted_at IS NULL
            `,
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
          `
          UPDATE alert_messages
          SET 
            message_type = $1,
            target_id = $2,
            message = $3,
            color = $4
          WHERE id = $5
        `,
          [messageType, targetId, message, color, id]
        );
      }
    }

    // Step 4: Make new columns NOT NULL (after migration)
    await queryRunner.query(`
      ALTER TABLE "alert_messages"
      ALTER COLUMN "message_type" SET NOT NULL,
      ALTER COLUMN "target_id" SET NOT NULL,
      ALTER COLUMN "message" SET NOT NULL
    `);

    // Step 5: Drop old columns and enum
    await queryRunner.query(`
      ALTER TABLE "alert_messages"
      DROP COLUMN IF EXISTS "receptor_type",
      DROP COLUMN IF EXISTS "message_data"
    `);

    // Drop old enum if no other tables use it
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."alert_messages_receptor_type_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate old enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."alert_messages_receptor_type_enum" AS ENUM(
          'telegram', 'torreta', 'correo', 'receptor'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add back old columns
    await queryRunner.query(`
      ALTER TABLE "alert_messages"
      ADD COLUMN IF NOT EXISTS "receptor_type" "public"."alert_messages_receptor_type_enum",
      ADD COLUMN IF NOT EXISTS "message_data" jsonb
    `);

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
            `SELECT id FROM torretas WHERE external_id = $1 AND deleted_at IS NULL LIMIT 1`,
            [target_id]
          );
          const colorResult = await queryRunner.query(
            `SELECT id FROM torreta_colors WHERE device_color_id = $1 LIMIT 1`,
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
            `SELECT id FROM receptors WHERE external_id = $1 AND deleted_at IS NULL LIMIT 1`,
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
          `
          UPDATE alert_messages
          SET 
            receptor_type = $1,
            message_data = $2
          WHERE id = $3
        `,
          [receptorType, JSON.stringify(messageData), id]
        );
      }
    }

    // Make old columns NOT NULL
    await queryRunner.query(`
      ALTER TABLE "alert_messages"
      ALTER COLUMN "receptor_type" SET NOT NULL,
      ALTER COLUMN "message_data" SET NOT NULL
    `);

    // Drop new columns
    await queryRunner.query(`
      ALTER TABLE "alert_messages"
      DROP COLUMN IF EXISTS "message_type",
      DROP COLUMN IF EXISTS "target_id",
      DROP COLUMN IF EXISTS "message",
      DROP COLUMN IF EXISTS "color"
    `);

    // Drop new enum
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."alert_messages_message_type_enum"
    `);
  }
}

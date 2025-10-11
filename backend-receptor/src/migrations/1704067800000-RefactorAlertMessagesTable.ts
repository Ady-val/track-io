import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAlertMessagesTable1704067800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE alert_messages 
      ADD COLUMN message_data jsonb;
    `);

    await queryRunner.query(`
      UPDATE alert_messages 
      SET message_data = jsonb_build_object(
        CASE 
          WHEN receptor_type = 'reloj' THEN 'telegram'
          WHEN receptor_type = 'correo' THEN 'correo'
          WHEN receptor_type = 'torreta' THEN 'torreta'
          ELSE 'telegram'
        END,
        CASE
          WHEN receptor_type = 'correo' THEN jsonb_build_object(
            'emails', jsonb_build_array(receptor_id),
            'subject', 'Alerta',
            'message', COALESCE(message_content, 'Sin mensaje')
          )
          WHEN receptor_type = 'torreta' THEN jsonb_build_object(
            'torretaId', 1,
            'colorId', 1
          )
          ELSE jsonb_build_object(
            'title', COALESCE(receptor_name, 'Alerta'),
            'text', COALESCE(message_content, 'Sin mensaje')
          )
        END
      );
    `);

    // Update receptor_type enum values
    await queryRunner.query(`
      UPDATE alert_messages 
      SET receptor_type = 'telegram' 
      WHERE receptor_type = 'reloj';
    `);

    await queryRunner.query(`
      UPDATE alert_messages 
      SET receptor_type = 'telegram' 
      WHERE receptor_type = 'generico';
    `);

    // Drop old columns
    await queryRunner.query(`
      ALTER TABLE alert_messages 
      DROP COLUMN receptor_id,
      DROP COLUMN receptor_name,
      DROP COLUMN message_content;
    `);

    // Set message_data as NOT NULL
    await queryRunner.query(`
      ALTER TABLE alert_messages 
      ALTER COLUMN message_data SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back old columns
    await queryRunner.query(`
      ALTER TABLE alert_messages 
      ADD COLUMN receptor_id varchar(255),
      ADD COLUMN receptor_name varchar(255),
      ADD COLUMN message_content text;
    `);

    // Migrate data back (best effort)
    await queryRunner.query(`
      UPDATE alert_messages 
      SET 
        receptor_id = COALESCE(
          message_data->>'emails'->0,
          (message_data->>'torretaId')::text,
          'unknown'
        ),
        receptor_name = message_data->>'title',
        message_content = COALESCE(
          message_data->>'text',
          message_data->>'message'
        );
    `);

    // Drop new column
    await queryRunner.query(`
      ALTER TABLE alert_messages 
      DROP COLUMN message_data;
    `);
  }
}

import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorAlertMessagesTable1704067800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasMessageData = await queryRunner.hasColumn(
      'alert_messages',
      'message_data'
    );

    if (!hasMessageData) {
      await queryRunner.query(`
        ALTER TABLE alert_messages 
        ADD COLUMN message_data jsonb;
      `);
    }

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

    // Drop old columns (verificar si existen antes de eliminarlas)
    const hasReceptorId = await queryRunner.hasColumn(
      'alert_messages',
      'receptor_id'
    );
    const hasReceptorName = await queryRunner.hasColumn(
      'alert_messages',
      'receptor_name'
    );
    const hasMessageContent = await queryRunner.hasColumn(
      'alert_messages',
      'message_content'
    );

    if (hasReceptorId || hasReceptorName || hasMessageContent) {
      const columnsToDrop: string[] = [];
      if (hasReceptorId) columnsToDrop.push('DROP COLUMN receptor_id');
      if (hasReceptorName) columnsToDrop.push('DROP COLUMN receptor_name');
      if (hasMessageContent) columnsToDrop.push('DROP COLUMN message_content');

      if (columnsToDrop.length > 0) {
        await queryRunner.query(`
          ALTER TABLE alert_messages 
          ${columnsToDrop.join(',\n      ')};
        `);
      }
    }

    // Set message_data as NOT NULL (solo si la columna existe y es nullable)
    const alertMessagesTable = await queryRunner.getTable('alert_messages');
    const messageDataColumn =
      alertMessagesTable?.findColumnByName('message_data');
    if (messageDataColumn?.isNullable) {
      await queryRunner.query(`
        ALTER TABLE alert_messages 
        ALTER COLUMN message_data SET NOT NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back old columns (verificar si existen antes de agregarlas)
    const hasReceptorId = await queryRunner.hasColumn(
      'alert_messages',
      'receptor_id'
    );
    const hasReceptorName = await queryRunner.hasColumn(
      'alert_messages',
      'receptor_name'
    );
    const hasMessageContent = await queryRunner.hasColumn(
      'alert_messages',
      'message_content'
    );

    const columnsToAdd: string[] = [];
    if (!hasReceptorId)
      columnsToAdd.push('ADD COLUMN receptor_id varchar(255)');
    if (!hasReceptorName)
      columnsToAdd.push('ADD COLUMN receptor_name varchar(255)');
    if (!hasMessageContent)
      columnsToAdd.push('ADD COLUMN message_content text');

    if (columnsToAdd.length > 0) {
      await queryRunner.query(`
        ALTER TABLE alert_messages 
        ${columnsToAdd.join(',\n      ')};
      `);
    }

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

    // Drop new column (verificar si existe antes de eliminarla)
    const hasMessageData = await queryRunner.hasColumn(
      'alert_messages',
      'message_data'
    );
    if (hasMessageData) {
      await queryRunner.query(`
        ALTER TABLE alert_messages 
        DROP COLUMN message_data;
      `);
    }
  }
}

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVirtualDeviceFields1730000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_virtual_device to devices table
    await queryRunner.addColumn(
      'devices',
      new TableColumn({
        name: 'is_virtual_device',
        type: 'boolean',
        default: false,
      })
    );

    // Add virtual_device, reason, and comment to raw_measurements table
    await queryRunner.addColumn(
      'raw_measurements',
      new TableColumn({
        name: 'virtual_device',
        type: 'boolean',
        default: false,
      })
    );

    await queryRunner.addColumn(
      'raw_measurements',
      new TableColumn({
        name: 'reason',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'raw_measurements',
      new TableColumn({
        name: 'comment',
        type: 'text',
        isNullable: true,
      })
    );

    // Add virtual_device, reason, and comment to events table
    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'virtual_device',
        type: 'boolean',
        default: false,
      })
    );

    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'reason',
        type: 'varchar',
        length: '255',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      'events',
      new TableColumn({
        name: 'comment',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from devices table
    await queryRunner.dropColumn('devices', 'is_virtual_device');

    // Remove columns from raw_measurements table
    await queryRunner.dropColumn('raw_measurements', 'virtual_device');
    await queryRunner.dropColumn('raw_measurements', 'reason');
    await queryRunner.dropColumn('raw_measurements', 'comment');

    // Remove columns from events table
    await queryRunner.dropColumn('events', 'virtual_device');
    await queryRunner.dropColumn('events', 'reason');
    await queryRunner.dropColumn('events', 'comment');
  }
}


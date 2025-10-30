import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVirtualDeviceFields1730000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add is_virtual_device to devices table
    const devicesTable = await queryRunner.getTable('devices');
    const hasIsVirtualDevice =
      devicesTable?.findColumnByName('is_virtual_device');

    if (!hasIsVirtualDevice) {
      await queryRunner.addColumn(
        'devices',
        new TableColumn({
          name: 'is_virtual_device',
          type: 'boolean',
          default: false,
        })
      );
    }

    // Add virtual_device, reason, and comment to raw_measurements table
    const rawMeasurementsTable = await queryRunner.getTable('raw_measurements');
    const hasVirtualDevice =
      rawMeasurementsTable?.findColumnByName('virtual_device');
    const hasReason = rawMeasurementsTable?.findColumnByName('reason');
    const hasComment = rawMeasurementsTable?.findColumnByName('comment');

    if (!hasVirtualDevice) {
      await queryRunner.addColumn(
        'raw_measurements',
        new TableColumn({
          name: 'virtual_device',
          type: 'boolean',
          default: false,
        })
      );
    }

    if (!hasReason) {
      await queryRunner.addColumn(
        'raw_measurements',
        new TableColumn({
          name: 'reason',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      );
    }

    if (!hasComment) {
      await queryRunner.addColumn(
        'raw_measurements',
        new TableColumn({
          name: 'comment',
          type: 'text',
          isNullable: true,
        })
      );
    }

    // Add virtual_device, reason, and comment to events table
    const eventsTable = await queryRunner.getTable('events');
    const hasEventsVirtualDevice =
      eventsTable?.findColumnByName('virtual_device');
    const hasEventsReason = eventsTable?.findColumnByName('reason');
    const hasEventsComment = eventsTable?.findColumnByName('comment');

    if (!hasEventsVirtualDevice) {
      await queryRunner.addColumn(
        'events',
        new TableColumn({
          name: 'virtual_device',
          type: 'boolean',
          default: false,
        })
      );
    }

    if (!hasEventsReason) {
      await queryRunner.addColumn(
        'events',
        new TableColumn({
          name: 'reason',
          type: 'varchar',
          length: '255',
          isNullable: true,
        })
      );
    }

    if (!hasEventsComment) {
      await queryRunner.addColumn(
        'events',
        new TableColumn({
          name: 'comment',
          type: 'text',
          isNullable: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from devices table
    const devicesTable = await queryRunner.getTable('devices');
    if (devicesTable?.findColumnByName('is_virtual_device')) {
      await queryRunner.dropColumn('devices', 'is_virtual_device');
    }

    // Remove columns from raw_measurements table
    const rawMeasurementsTable = await queryRunner.getTable('raw_measurements');
    if (rawMeasurementsTable?.findColumnByName('virtual_device')) {
      await queryRunner.dropColumn('raw_measurements', 'virtual_device');
    }
    if (rawMeasurementsTable?.findColumnByName('reason')) {
      await queryRunner.dropColumn('raw_measurements', 'reason');
    }
    if (rawMeasurementsTable?.findColumnByName('comment')) {
      await queryRunner.dropColumn('raw_measurements', 'comment');
    }

    // Remove columns from events table
    const eventsTable = await queryRunner.getTable('events');
    if (eventsTable?.findColumnByName('virtual_device')) {
      await queryRunner.dropColumn('events', 'virtual_device');
    }
    if (eventsTable?.findColumnByName('reason')) {
      await queryRunner.dropColumn('events', 'reason');
    }
    if (eventsTable?.findColumnByName('comment')) {
      await queryRunner.dropColumn('events', 'comment');
    }
  }
}

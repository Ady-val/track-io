import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsVirtualDeviceToDevices1704068800000
  implements MigrationInterface
{
  name = 'AddIsVirtualDeviceToDevices1704068800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'devices',
      new TableColumn({
        name: 'is_virtual_device',
        type: 'boolean',
        default: false,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('devices', 'is_virtual_device');
  }
}

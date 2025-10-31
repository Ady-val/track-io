import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBannerFieldsToTorretas1730001000000 implements MigrationInterface {
  name = 'AddBannerFieldsToTorretas1730001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('torretas', [
      new TableColumn({ name: 'type', type: 'varchar', length: '20', isNullable: false, default: `'STANDARD'` }),
      new TableColumn({ name: 'mode', type: 'varchar', length: '20', isNullable: true }),
      new TableColumn({ name: 'start_register', type: 'integer', isNullable: true }),
      new TableColumn({ name: 'register_count', type: 'integer', isNullable: true }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('torretas', ['register_count', 'start_register', 'mode', 'type']);
  }
}



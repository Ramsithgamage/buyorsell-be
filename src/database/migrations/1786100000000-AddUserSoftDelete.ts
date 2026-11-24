import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSoftDelete1786100000000 implements MigrationInterface {
  name = 'AddUserSoftDelete1786100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`deleted_at\` datetime(6) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`deleted_at\``);
  }
}

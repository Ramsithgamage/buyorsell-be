import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatarUrl1786000000000 implements MigrationInterface {
  name = 'AddUserAvatarUrl1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`avatar_url\` varchar(500) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`avatar_url\``);
  }
}

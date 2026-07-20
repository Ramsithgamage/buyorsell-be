import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdvertisementArchiveTable1784513069567 implements MigrationInterface {
    name = 'AddAdvertisementArchiveTable1784513069567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` ON \`verification_tokens\``);
        await queryRunner.query(`CREATE TABLE \`advertisement_archives\` (\`id\` int NOT NULL, \`title\` varchar(255) NOT NULL, \`slug\` varchar(300) NOT NULL, \`description\` text NOT NULL, \`price\` decimal(10,2) NOT NULL, \`user_id\` int NOT NULL, \`category_id\` int NOT NULL, \`images\` json NULL, \`created_at\` datetime NOT NULL, \`updated_at\` datetime NOT NULL, \`archived_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`archived_by\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`verification_tokens\` ADD UNIQUE INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` (\`token\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`verification_tokens\` DROP INDEX \`IDX_b00b1be0e5a820594d7c07a3df\``);
        await queryRunner.query(`DROP TABLE \`advertisement_archives\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` ON \`verification_tokens\` (\`token\`)`);
    }

}

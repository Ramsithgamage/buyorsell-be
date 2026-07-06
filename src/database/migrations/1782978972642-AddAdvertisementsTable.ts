import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdvertisementsTable1782978972642 implements MigrationInterface {
    name = 'AddAdvertisementsTable1782978972642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`advertisements\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`slug\` varchar(300) NOT NULL, \`description\` text NOT NULL, \`price\` decimal(10,2) NOT NULL, \`user_id\` int NOT NULL, \`category_id\` int NOT NULL, \`images\` json NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_f817913e4944f6f152443b540f\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`)`);
        await queryRunner.query(`ALTER TABLE \`verification_tokens\` ADD UNIQUE INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` (\`token\`)`);
        await queryRunner.query(`ALTER TABLE \`guest_sessions\` ADD UNIQUE INDEX \`IDX_49224750b99de6c1673e25ed73\` (\`guest_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_e949ac5afe4dc39f8f23c9d2fa\` ON \`verification_tokens\` (\`expires_at\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_4e1a495b189d88c3885197d3c0\` ON \`guest_sessions\` (\`expires_at\`)`);
        await queryRunner.query(`ALTER TABLE \`advertisements\` ADD CONSTRAINT \`FK_6277b5b1c6ac26154f49ba2ef7c\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`advertisements\` ADD CONSTRAINT \`FK_11ad11390e35dd24080dea221cd\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`advertisements\` DROP FOREIGN KEY \`FK_11ad11390e35dd24080dea221cd\``);
        await queryRunner.query(`ALTER TABLE \`advertisements\` DROP FOREIGN KEY \`FK_6277b5b1c6ac26154f49ba2ef7c\``);
        await queryRunner.query(`DROP INDEX \`IDX_4e1a495b189d88c3885197d3c0\` ON \`guest_sessions\``);
        await queryRunner.query(`DROP INDEX \`IDX_e949ac5afe4dc39f8f23c9d2fa\` ON \`verification_tokens\``);
        await queryRunner.query(`ALTER TABLE \`guest_sessions\` DROP INDEX \`IDX_49224750b99de6c1673e25ed73\``);
        await queryRunner.query(`ALTER TABLE \`verification_tokens\` DROP INDEX \`IDX_b00b1be0e5a820594d7c07a3df\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\``);
        await queryRunner.query(`DROP INDEX \`IDX_f817913e4944f6f152443b540f\` ON \`advertisements\``);
        await queryRunner.query(`DROP TABLE \`advertisements\``);
    }

}

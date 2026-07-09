import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRolesAndVendorProfiles1783575800785 implements MigrationInterface {
    name = 'AddUserRolesAndVendorProfiles1783575800785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_users_email\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` ON \`verification_tokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_verification_tokens_expires_at\` ON \`verification_tokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_verification_tokens_token\` ON \`verification_tokens\``);
        await queryRunner.query(`DROP INDEX \`IDX_guest_sessions_expires_at\` ON \`guest_sessions\``);
        await queryRunner.query(`DROP INDEX \`IDX_guest_sessions_guest_id\` ON \`guest_sessions\``);
        await queryRunner.query(`CREATE TABLE \`vendor_profiles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`company_name\` varchar(255) NOT NULL, \`business_registration_number\` varchar(100) NOT NULL, \`user_id\` int NULL, UNIQUE INDEX \`REL_193d7cc6d4254e2098da2eda45\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`role\` varchar(20) NOT NULL DEFAULT 'USER'`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`approval_status\` varchar(20) NOT NULL DEFAULT 'APPROVED'`);
        await queryRunner.query(`ALTER TABLE \`verification_tokens\` ADD UNIQUE INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` (\`token\`)`);
        await queryRunner.query(`ALTER TABLE \`vendor_profiles\` ADD CONSTRAINT \`FK_193d7cc6d4254e2098da2eda45b\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`vendor_profiles\` DROP FOREIGN KEY \`FK_193d7cc6d4254e2098da2eda45b\``);
        await queryRunner.query(`ALTER TABLE \`verification_tokens\` DROP INDEX \`IDX_b00b1be0e5a820594d7c07a3df\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`approval_status\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`role\``);
        await queryRunner.query(`DROP INDEX \`REL_193d7cc6d4254e2098da2eda45\` ON \`vendor_profiles\``);
        await queryRunner.query(`DROP TABLE \`vendor_profiles\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_guest_sessions_guest_id\` ON \`guest_sessions\` (\`guest_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_guest_sessions_expires_at\` ON \`guest_sessions\` (\`expires_at\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_verification_tokens_token\` ON \`verification_tokens\` (\`token\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_verification_tokens_expires_at\` ON \`verification_tokens\` (\`expires_at\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_b00b1be0e5a820594d7c07a3df\` ON \`verification_tokens\` (\`token\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_users_email\` ON \`users\` (\`email\`)`);
    }

}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1781761703914 implements MigrationInterface {
  name = 'InitialSchema1781761703914';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create users table
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`first_name\` VARCHAR(50) NOT NULL,
        \`last_name\` VARCHAR(50) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`status\` TINYINT NOT NULL DEFAULT '0',
        \`refresh_token\` VARCHAR(255) NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 2. Create guest_sessions table
    await queryRunner.query(`
      CREATE TABLE \`guest_sessions\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`guest_id\` VARCHAR(36) NOT NULL,
        \`expires_at\` DATETIME NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_guest_sessions_guest_id\` (\`guest_id\`),
        INDEX \`IDX_guest_sessions_expires_at\` (\`expires_at\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 3. Create verification_tokens table
    await queryRunner.query(`
      CREATE TABLE \`verification_tokens\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`token\` VARCHAR(64) NOT NULL,
        \`expires_at\` DATETIME NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`userId\` INT NULL,
        UNIQUE INDEX \`IDX_verification_tokens_token\` (\`token\`),
        INDEX \`IDX_verification_tokens_expires_at\` (\`expires_at\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 4. Add foreign key constraint on verification_tokens
    await queryRunner.query(`
      ALTER TABLE \`verification_tokens\`
      ADD CONSTRAINT \`FK_8eb720a87e85b20fdfc69c38269\`
      FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE \`verification_tokens\` DROP FOREIGN KEY \`FK_8eb720a87e85b20fdfc69c38269\`
    `);

    // 2. Drop verification_tokens table
    await queryRunner.query(`DROP TABLE \`verification_tokens\``);

    // 3. Drop guest_sessions table
    await queryRunner.query(`DROP TABLE \`guest_sessions\``);

    // 4. Drop users table
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}

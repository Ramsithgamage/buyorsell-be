import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseRefactoring1718665839000 implements MigrationInterface {
  name = 'DatabaseRefactoring1718665839000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Refactor users table column constraints and lengths
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      MODIFY COLUMN \`first_name\` VARCHAR(50) NOT NULL,
      MODIFY COLUMN \`last_name\` VARCHAR(50) NOT NULL,
      MODIFY COLUMN \`email\` VARCHAR(255) NOT NULL,
      MODIFY COLUMN \`status\` TINYINT NOT NULL DEFAULT 0,
      MODIFY COLUMN \`refresh_token\` VARCHAR(255) NULL
    `);

    // Ensure unique index on email
    // Check if the unique constraint or index already exists, if not create it
    const emailIndexes = await queryRunner.query(`
      SHOW INDEX FROM \`users\` WHERE Column_name = 'email'
    `);
    if (emailIndexes.length === 0) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`IDX_users_email\` ON \`users\` (\`email\`)
      `);
    }

    // 2. Refactor guest_sessions constraints and indexes
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\` 
      MODIFY COLUMN \`guest_id\` VARCHAR(36) NOT NULL
    `);

    const guestIdIndexes = await queryRunner.query(`
      SHOW INDEX FROM \`guest_sessions\` WHERE Column_name = 'guest_id'
    `);
    if (guestIdIndexes.length === 0) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`IDX_guest_sessions_guest_id\` ON \`guest_sessions\` (\`guest_id\`)
      `);
    }

    const expiresAtGuestIndexes = await queryRunner.query(`
      SHOW INDEX FROM \`guest_sessions\` WHERE Key_name = 'IDX_guest_sessions_expires_at' OR (Column_name = 'expires_at' AND Non_unique = 1)
    `);
    if (expiresAtGuestIndexes.length === 0) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_guest_sessions_expires_at\` ON \`guest_sessions\` (\`expires_at\`)
      `);
    }

    // 3. Refactor verification_tokens constraints and indexes
    await queryRunner.query(`
      ALTER TABLE \`verification_tokens\` 
      MODIFY COLUMN \`token\` VARCHAR(64) NOT NULL
    `);

    const tokenIndexes = await queryRunner.query(`
      SHOW INDEX FROM \`verification_tokens\` WHERE Column_name = 'token'
    `);
    if (tokenIndexes.length === 0) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`IDX_verification_tokens_token\` ON \`verification_tokens\` (\`token\`)
      `);
    }

    const expiresAtTokenIndexes = await queryRunner.query(`
      SHOW INDEX FROM \`verification_tokens\` WHERE Key_name = 'IDX_verification_tokens_expires_at' OR (Column_name = 'expires_at' AND Non_unique = 1)
    `);
    if (expiresAtTokenIndexes.length === 0) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_verification_tokens_expires_at\` ON \`verification_tokens\` (\`expires_at\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert verification_tokens changes
    await queryRunner.query(`DROP INDEX \`IDX_verification_tokens_expires_at\` ON \`verification_tokens\``).catch(() => {});
    await queryRunner.query(`DROP INDEX \`IDX_verification_tokens_token\` ON \`verification_tokens\``).catch(() => {});
    await queryRunner.query(`
      ALTER TABLE \`verification_tokens\` 
      MODIFY COLUMN \`token\` VARCHAR(255) NOT NULL
    `);

    // Revert guest_sessions changes
    await queryRunner.query(`DROP INDEX \`IDX_guest_sessions_expires_at\` ON \`guest_sessions\``).catch(() => {});
    await queryRunner.query(`DROP INDEX \`IDX_guest_sessions_guest_id\` ON \`guest_sessions\``).catch(() => {});
    await queryRunner.query(`
      ALTER TABLE \`guest_sessions\` 
      MODIFY COLUMN \`guest_id\` VARCHAR(255) NOT NULL
    `);

    // Revert users changes
    await queryRunner.query(`DROP INDEX \`IDX_users_email\` ON \`users\``).catch(() => {});
    await queryRunner.query(`
      ALTER TABLE \`users\` 
      MODIFY COLUMN \`first_name\` VARCHAR(255) NOT NULL,
      MODIFY COLUMN \`last_name\` VARCHAR(255) NOT NULL,
      MODIFY COLUMN \`email\` VARCHAR(255) NOT NULL,
      MODIFY COLUMN \`status\` INT NOT NULL DEFAULT 0,
      MODIFY COLUMN \`refresh_token\` VARCHAR(255) NULL
    `);
  }
}

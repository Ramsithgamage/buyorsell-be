import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1785200000000 implements MigrationInterface {
  name = 'CreateNotificationsTable1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the table
    await queryRunner.query(`
      CREATE TABLE \`notifications\` (
        \`id\`         INT          NOT NULL AUTO_INCREMENT,
        \`user_id\`    INT          NOT NULL,
        \`order_id\`   INT          NULL,
        \`type\`       ENUM('ORDER_PLACED','ORDER_SHIPPED','ORDER_CANCELLED','ORDER_DELIVERED')
                                   NOT NULL,
        \`title\`      VARCHAR(255) NOT NULL,
        \`body\`       TEXT         NOT NULL,
        \`read_at\`    DATETIME(6)  NULL,
        \`created_at\` DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 2. Index for the primary query pattern: fetch/count by user + unread state
    await queryRunner.query(`
      CREATE INDEX \`idx_notifications_user_read_at\`
      ON \`notifications\` (\`user_id\`, \`read_at\`)
    `);

    // 3. Foreign key constraints
    await queryRunner.query(`
      ALTER TABLE \`notifications\`
      ADD CONSTRAINT \`fk_notifications_user\`
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`notifications\`
      ADD CONSTRAINT \`fk_notifications_order\`
      FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`)
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order: FKs → index → table
    await queryRunner.query(
      `ALTER TABLE \`notifications\` DROP FOREIGN KEY \`fk_notifications_order\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notifications\` DROP FOREIGN KEY \`fk_notifications_user\``,
    );

    await queryRunner.query(
      `DROP INDEX \`idx_notifications_user_read_at\` ON \`notifications\``,
    );

    await queryRunner.query(`DROP TABLE \`notifications\``);
  }
}


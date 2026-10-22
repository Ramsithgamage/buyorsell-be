import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTable1785100000000 implements MigrationInterface {
  name = 'CreateOrdersTable1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the table
    await queryRunner.query(`
      CREATE TABLE \`orders\` (
        \`id\`         INT              NOT NULL AUTO_INCREMENT,
        \`ad_id\`      INT              NOT NULL,
        \`buyer_id\`   INT              NOT NULL,
        \`seller_id\`  INT              NOT NULL,
        \`quantity\`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
        \`address\`    TEXT             NOT NULL,
        \`message\`    TEXT             NULL,
        \`status\`     ENUM('PENDING', 'SHIPPED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        \`created_at\` DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // 2. Indexes for the two primary query patterns
    await queryRunner.query(`
      CREATE INDEX \`idx_orders_seller_status\`
      ON \`orders\` (\`seller_id\`, \`status\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`idx_orders_buyer_status\`
      ON \`orders\` (\`buyer_id\`, \`status\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`idx_orders_ad\`
      ON \`orders\` (\`ad_id\`)
    `);

    // 3. Foreign key constraints
    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD CONSTRAINT \`fk_orders_ad\`
      FOREIGN KEY (\`ad_id\`) REFERENCES \`advertisements\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD CONSTRAINT \`fk_orders_buyer\`
      FOREIGN KEY (\`buyer_id\`) REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`orders\`
      ADD CONSTRAINT \`fk_orders_seller\`
      FOREIGN KEY (\`seller_id\`) REFERENCES \`users\`(\`id\`)
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse order: FKs → indexes → table
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`fk_orders_seller\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`fk_orders_buyer\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`orders\` DROP FOREIGN KEY \`fk_orders_ad\``,
    );

    await queryRunner.query(
      `DROP INDEX \`idx_orders_ad\` ON \`orders\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_orders_buyer_status\` ON \`orders\``,
    );
    await queryRunner.query(
      `DROP INDEX \`idx_orders_seller_status\` ON \`orders\``,
    );

    await queryRunner.query(`DROP TABLE \`orders\``);
  }
}

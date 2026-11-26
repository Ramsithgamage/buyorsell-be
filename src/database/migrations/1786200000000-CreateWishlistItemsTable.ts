import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWishlistItemsTable1786200000000 implements MigrationInterface {
  name = 'CreateWishlistItemsTable1786200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`wishlist_items\` (
        \`id\`               INT         NOT NULL AUTO_INCREMENT,
        \`user_id\`          INT         NOT NULL,
        \`advertisement_id\` INT         NOT NULL,
        \`created_at\`       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_wishlist_user_ad\` (\`user_id\`, \`advertisement_id\`),
        KEY \`idx_wishlist_ad\` (\`advertisement_id\`),
        CONSTRAINT \`fk_wishlist_user\` FOREIGN KEY (\`user_id\`)
          REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`fk_wishlist_ad\` FOREIGN KEY (\`advertisement_id\`)
          REFERENCES \`advertisements\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`wishlist_items\``);
  }
}

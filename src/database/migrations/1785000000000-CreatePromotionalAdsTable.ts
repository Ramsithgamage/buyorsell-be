import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePromotionalAdsTable1785000000000 implements MigrationInterface {
  name = 'CreatePromotionalAdsTable1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE \`promotional_advertisements\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`image\` varchar(500) NOT NULL,
                \`link_url\` varchar(500) NOT NULL,
                \`start_date\` datetime NOT NULL,
                \`end_date\` datetime NOT NULL,
                \`is_active\` tinyint NOT NULL DEFAULT 1,
                \`created_by\` int NOT NULL,
                \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);

    await queryRunner.query(`
            CREATE INDEX \`IDX_promo_ads_active_dates\` 
            ON \`promotional_advertisements\` (\`is_active\`, \`start_date\`, \`end_date\`)
        `);

    await queryRunner.query(`
            ALTER TABLE \`promotional_advertisements\` 
            ADD CONSTRAINT \`FK_promo_ads_created_by\` 
            FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`id\`) 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`promotional_advertisements\` DROP FOREIGN KEY \`FK_promo_ads_created_by\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_promo_ads_active_dates\` ON \`promotional_advertisements\``,
    );
    await queryRunner.query(`DROP TABLE \`promotional_advertisements\``);
  }
}

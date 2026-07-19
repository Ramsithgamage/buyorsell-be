import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateApiLogsTable1783580000000 implements MigrationInterface {
    name = 'CreateApiLogsTable1783580000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`api_logs\` (
                \`id\` varchar(36) NOT NULL,
                \`method\` varchar(10) NOT NULL,
                \`path\` varchar(255) NOT NULL,
                \`statusCode\` int NOT NULL,
                \`durationMs\` int NOT NULL,
                \`userId\` int NULL,
                \`metadata\` json NOT NULL,
                \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`IDX_API_LOGS_METHOD\` (\`method\`),
                INDEX \`IDX_API_LOGS_STATUS_CODE\` (\`statusCode\`),
                INDEX \`IDX_API_LOGS_USER_ID\` (\`userId\`),
                INDEX \`IDX_API_LOGS_CREATED_AT\` (\`createdAt\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`api_logs\``);
    }
}

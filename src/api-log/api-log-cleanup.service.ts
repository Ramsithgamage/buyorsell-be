import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ApiLog } from './entities/api-log.entity';

@Injectable()
export class ApiLogCleanupService {
  private readonly logger = new Logger(ApiLogCleanupService.name);

  constructor(
    @InjectRepository(ApiLog)
    private readonly logRepository: Repository<ApiLog>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldLogs() {
    this.logger.log('Starting daily API logs cleanup job...');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deleteResult = await this.logRepository.delete({
        createdAt: LessThan(sevenDaysAgo),
      });

      this.logger.log(
        `Successfully deleted ${deleteResult.affected || 0} API logs older than 7 days (before ${sevenDaysAgo.toISOString()}).`,
      );
    } catch (error) {
      this.logger.error('Failed to execute API logs cleanup job', error instanceof Error ? error.stack : error);
    }
  }
}

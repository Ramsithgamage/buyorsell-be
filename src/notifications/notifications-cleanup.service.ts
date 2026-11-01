import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsCleanupService {
  private readonly logger = new Logger(NotificationsCleanupService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldNotifications(): Promise<void> {
    this.logger.log('Starting daily notifications cleanup job...');
    try {
      const deleted = await this.notificationsService.deleteOlderThan(90);
      this.logger.log(
        `Successfully deleted ${deleted} notification(s) older than 90 days.`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to execute notifications cleanup job',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}


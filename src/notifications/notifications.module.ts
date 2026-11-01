import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsCleanupService } from './notifications-cleanup.service';
import { NotificationsController } from './notifications.controller';
import { SseService } from './sse.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    SseService,
    NotificationsService,
    NotificationsCleanupService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}


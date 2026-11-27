import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '../common/enums/notification-type.enum';
import { SseService } from './sse.service';
import {
  NotificationResponseDto,
  PaginatedNotificationResponseDto,
} from './dto/notification-response.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly sseService: SseService,
  ) {}

  // ── Create (called by OrdersService) ─────────────────────────────────────────

  /**
   * Inserts a notification row for the given user and immediately pushes it
   * over SSE if the user has an open connection.
   *
   * Fire-and-forget: errors are logged but never rethrown so that a failed
   * notification never causes an order mutation to roll back.
   */
  async createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    body: string,
    orderId?: number,
  ): Promise<void> {
    try {
      const notification = this.notificationRepository.create({
        userId,
        type,
        title,
        body,
        orderId: orderId ?? null,
        readAt: null,
      });

      const saved = await this.notificationRepository.save(notification);

      const dto = plainToInstance(NotificationResponseDto, saved, {
        excludeExtraneousValues: true,
      });

      this.sseService.push(userId, dto);
    } catch (error) {
      this.logger.error(
        `Failed to create notification for user ${userId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }

  // ── REST query methods ────────────────────────────────────────────────────────

  async findForUser(
    userId: number,
    unreadOnly: boolean,
    page: number,
    limit: number,
    type?: NotificationType,
  ): Promise<PaginatedNotificationResponseDto> {
    const where: Record<string, unknown> = { userId };
    if (unreadOnly) where['readAt'] = IsNull();
    if (
      type &&
      Object.values(NotificationType).includes(type as NotificationType)
    ) {
      where['type'] = type;
    }

    const [data, totalItems] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: plainToInstance(NotificationResponseDto, data, {
        excludeExtraneousValues: true,
      }),
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async countUnread(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, readAt: IsNull() },
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(
        `Notification with ID ${notificationId} not found.`,
      );
    }
    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not own this notification.');
    }
    if (notification.readAt) return; // already read — no-op

    notification.readAt = new Date();
    await this.notificationRepository.save(notification);
  }

  async markAllRead(userId: number): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: new Date() })
      .where('user_id = :userId AND read_at IS NULL', { userId })
      .execute();
  }

  // ── Cleanup (called by cron) ──────────────────────────────────────────────────

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.notificationRepository.delete({
      createdAt: LessThan(cutoff),
    });

    return result.affected ?? 0;
  }
}


import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { NotificationType } from '../../common/enums/notification-type.enum';

// ── Single notification ───────────────────────────────────────────────────────

export class NotificationResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ enum: NotificationType, example: NotificationType.ORDER_PLACED })
  @Expose()
  type!: NotificationType;

  @ApiProperty({ example: 'New Order Received' })
  @Expose()
  title!: string;

  @ApiProperty({ example: 'John Doe placed an order for Vintage Camera.' })
  @Expose()
  body!: string;

  @ApiProperty({ example: 7, nullable: true })
  @Expose()
  orderId!: number | null;

  @ApiProperty({ example: null, nullable: true, description: 'null = unread' })
  @Expose()
  readAt!: Date | null;

  @ApiProperty({ example: '2026-10-31T15:00:00.000Z' })
  @Expose()
  createdAt!: Date;
}

// ── Paginated wrapper ─────────────────────────────────────────────────────────

export class NotificationPaginationMetaDto {
  @ApiProperty({ example: 50 })
  totalItems!: number;

  @ApiProperty({ example: 20 })
  itemCount!: number;

  @ApiProperty({ example: 20 })
  itemsPerPage!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;

  @ApiProperty({ example: 1 })
  currentPage!: number;
}

export class PaginatedNotificationResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data!: NotificationResponseDto[];

  @ApiProperty({ type: NotificationPaginationMetaDto })
  meta!: NotificationPaginationMetaDto;
}

// ── Unread count ──────────────────────────────────────────────────────────────

export class UnreadCountDto {
  @ApiProperty({ example: 3 })
  count!: number;
}


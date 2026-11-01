import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  Post,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { NotificationsService } from './notifications.service';
import { SseService } from './sse.service';
import {
  NotificationResponseDto,
  PaginatedNotificationResponseDto,
  UnreadCountDto,
} from './dto/notification-response.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseInterceptors(ClassSerializerInterceptor)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly sseService: SseService,
  ) {}

  // ── POST /notifications/stream-ticket ─────────────────────────────────────
  // Issues a short-lived ticket used to authenticate the SSE connection.
  // JwtAuthGuard is applied here so the ticket is only issued to logged-in users.

  @Post('stream-ticket')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Issue a 30-second SSE ticket for the current user',
  })
  @ApiResponse({ status: 201, schema: { example: { ticket: '<uuid>' } } })
  issueStreamTicket(
    @CurrentUser() user: JwtPayload,
  ): { ticket: string } {
    const ticket = this.sseService.issueTicket(user.sub!);
    return { ticket };
  }

  // ── GET /notifications/stream ─────────────────────────────────────────────
  // No JwtAuthGuard — the one-time ticket is the credential.
  // Uses raw Express Response so we can write SSE frames directly.

  @Get('stream')
  @ApiOperation({
    summary: 'Open a long-lived SSE stream (authenticate via ?ticket=)',
  })
  @ApiQuery({ name: 'ticket', required: true, type: String })
  @ApiResponse({ status: 200, description: 'text/event-stream' })
  @ApiResponse({ status: 400, description: 'Invalid or expired ticket' })
  openStream(
    @Query('ticket') ticket: string,
    @Res() res: Response,
  ): void {
    const userId = this.sseService.consumeTicket(ticket);
    if (userId === null) {
      throw new BadRequestException('Invalid or expired SSE ticket.');
    }
    this.sseService.registerConnection(userId, res);
    // Response is held open by SseService — do not call res.end() here.
  }

  // ── GET /notifications ────────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated notifications for the current user' })
  @ApiQuery({ name: 'unread', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: PaginatedNotificationResponseDto })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('unread') unread?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<PaginatedNotificationResponseDto> {
    return this.notificationsService.findForUser(
      user.sub!,
      unread === 'true',
      Math.max(1, parseInt(page, 10) || 1),
      Math.min(50, Math.max(1, parseInt(limit, 10) || 20)),
    );
  }

  // ── GET /notifications/unread-count ──────────────────────────────────────

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the number of unread notifications' })
  @ApiResponse({ status: 200, type: UnreadCountDto })
  async unreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<UnreadCountDto> {
    const count = await this.notificationsService.countUnread(user.sub!);
    return { count };
  }

  // ── PATCH /notifications/read-all ─────────────────────────────────────────

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiResponse({ status: 204 })
  async markAllRead(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.notificationsService.markAllRead(user.sub!);
  }

  // ── PATCH /notifications/:id/read ─────────────────────────────────────────

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403, description: 'Not the owner of this notification' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.notificationsService.markAsRead(id, user.sub!);
  }
}


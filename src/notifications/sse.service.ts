import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import { NotificationResponseDto } from './dto/notification-response.dto';

interface Ticket {
  userId: number;
  expiresAt: number; // Date.now() ms
}

const TICKET_TTL_MS = 30_000; // 30 seconds
const HEARTBEAT_INTERVAL_MS = 25_000; // 25 seconds

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);

  /** One-time tickets: ticketId → { userId, expiresAt } */
  private readonly tickets = new Map<string, Ticket>();

  /** Live SSE connections: userId → Express Response */
  private readonly connections = new Map<number, Response>();

  // ── Ticket lifecycle ────────────────────────────────────────────────────────

  /**
   * Creates a short-lived ticket for the given user.
   * The ticket must be consumed by GET /notifications/stream within 30 s.
   */
  issueTicket(userId: number): string {
    const ticket = randomUUID();
    this.tickets.set(ticket, { userId, expiresAt: Date.now() + TICKET_TTL_MS });

    // Auto-expire: remove from map after TTL to avoid leaking memory
    setTimeout(() => this.tickets.delete(ticket), TICKET_TTL_MS);

    return ticket;
  }

  /**
   * Validates and consumes a ticket. Returns the userId on success, or null if
   * the ticket is invalid or expired.
   * Tickets are one-use — removed from the map immediately.
   */
  consumeTicket(ticket: string): number | null {
    const entry = this.tickets.get(ticket);
    if (!entry) return null;

    this.tickets.delete(ticket); // consume — cannot be reused

    if (Date.now() > entry.expiresAt) return null;

    return entry.userId;
  }

  // ── SSE connection lifecycle ─────────────────────────────────────────────────

  /**
   * Registers a validated SSE response for a user and begins heartbeat pings.
   * If the user already has an open connection it is replaced.
   */
  registerConnection(userId: number, res: Response): void {
    // Close any existing connection for this user
    this.connections.get(userId)?.end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
    res.flushHeaders();

    this.connections.set(userId, res);
    this.logger.log(`SSE connection opened for user ${userId}`);

    // Send periodic heartbeat comments to keep the connection alive
    const heartbeat = setInterval(() => {
      if (res.writableEnded) {
        clearInterval(heartbeat);
        return;
      }
      res.write(': ping\n\n');
    }, HEARTBEAT_INTERVAL_MS);

    // Clean up when the client disconnects
    res.on('close', () => {
      clearInterval(heartbeat);
      this.connections.delete(userId);
      this.logger.log(`SSE connection closed for user ${userId}`);
    });
  }

  // ── Push notification ────────────────────────────────────────────────────────

  /**
   * Pushes a notification to the user's open SSE connection, if any.
   * Silently does nothing when the user is not currently connected.
   */
  push(userId: number, notification: NotificationResponseDto): void {
    const res = this.connections.get(userId);
    if (!res || res.writableEnded) return;

    const data = JSON.stringify(notification);
    res.write(`data: ${data}\n\n`);
  }
}


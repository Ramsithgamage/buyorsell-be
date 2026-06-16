import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { GuestSession } from './entities/guest-session.entity';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class GuestSessionService {
  constructor(
    @InjectRepository(GuestSession)
    private guestRepository: Repository<GuestSession>,
  ) {}

  async createGuestSession(
    guestId: string,
    expiresAt: Date,
  ) {
    const session =
      this.guestRepository.create({
        guestId,
        expiresAt,
      });

    return this.guestRepository.save(session);
  }

  async findByGuestId(
    guestId: string,
  ) {
    const session =
      await this.guestRepository.findOne({
        where: {
          guestId,
        },
      });

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  @Cron('0 * * * *')
  async deleteExpiredGuestSessions() {
    await this.guestRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
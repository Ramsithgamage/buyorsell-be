import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuestSession } from './entities/guest-session.entity';

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
    return this.guestRepository.findOne({
      where: {
        guestId,
      },
    });
  }
}
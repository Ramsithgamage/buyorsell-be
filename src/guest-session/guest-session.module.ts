import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GuestSession } from './entities/guest-session.entity';

import { GuestSessionService } from './guest-session.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GuestSession,
    ]),
  ],
  providers: [GuestSessionService],
  exports: [GuestSessionService],
})
export class GuestSessionModule {}
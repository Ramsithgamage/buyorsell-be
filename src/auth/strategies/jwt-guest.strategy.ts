import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { GuestSessionService } from '../../guest-session/guest-session.service';

@Injectable()
export class JwtGuestStrategy extends PassportStrategy(
  Strategy,
  'jwt-guest',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly guestSessionService: GuestSessionService,
  ) {
    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('GUEST_TOKEN_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.guestId) {
      throw new UnauthorizedException('Invalid guest token payload');
    }
    if (payload.type !== 'guest') {
      throw new UnauthorizedException('Guest token is required');
    }

    const session = await this.guestSessionService.findByGuestId(payload.guestId);
    if (!session) {
      throw new UnauthorizedException('Guest session has expired or is invalid');
    }

    return payload;
  }
}

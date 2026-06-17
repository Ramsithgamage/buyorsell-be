import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtGuestStrategy extends PassportStrategy(
  Strategy,
  'jwt-guest',
) {
  constructor(
    private readonly configService: ConfigService,
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
    return payload;
  }
}

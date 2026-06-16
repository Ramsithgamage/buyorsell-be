import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GuestTokenGuard
  implements CanActivate
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest();

    const authHeader =
      request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(
        'Missing authorization header',
      );
    }

    const token =
      authHeader.replace('Bearer ', '');

    try {
      const payload =
        await this.jwtService.verifyAsync(
          token,
          {
            secret:
              this.configService.get(
                'GUEST_TOKEN_SECRET',
              ),
          },
        );

      request.guest = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Invalid guest token',
      );
    }
  }
}
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GuestTokenGuard
  implements CanActivate
{
  constructor(
    private readonly jwtService: JwtService,
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
        'Guest token required',
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
              process.env.GUEST_TOKEN_SECRET,
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
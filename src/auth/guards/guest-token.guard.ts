import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GuestTokenGuard extends AuthGuard('jwt-guest') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid guest token');
    }
    const request = context.switchToHttp().getRequest();
    request.guest = user;
    return user;
  }
}
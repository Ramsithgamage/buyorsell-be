import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { GuestTokenGuard } from './guards/guest-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

@Get('verify')
@Throttle({default: {limit: 5, ttl: 3600}})
verifyEmail(
  @Query('token')
  token: string,
) {
  return this.authService
    .verifyEmail(token);
}


@Post('register')
@UseGuards(GuestTokenGuard)
@Throttle({default: {limit: 5, ttl: 3600}})
register(
  @Body()
  createUserDto: CreateUserDto,
) {
  return this.authService.register(
    createUserDto,
  );
}

  @Post('login')
  @UseGuards(GuestTokenGuard)
  @Throttle({default: {limit: 5, ttl: 3600}})
  login(
    @Body()
    loginDto: LoginDto,
  ) {
    return this.authService.login(
      loginDto,
    );
  }

  @Post('refresh_token')
  @UseGuards(JwtRefreshGuard)
  @Throttle({default: {limit: 10, ttl: 3600}})
  refreshToken(
    @CurrentUser()
    user: any,
    @Body()
    dto: RefreshTokenDto,
  ) {
    return this.authService
      .refreshToken(
        user.id,
        user.email,
      );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(
    @Request()
    req: any,
  ) {
    return this.authService.logout(
      req.user.sub,
    );
  }

}
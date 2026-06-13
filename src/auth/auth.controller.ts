import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { GuestTokenGuard } from './guards/guest-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

@Get('verify')
verifyEmail(
  @Query('token')
  token: string,
) {
  return this.authService
    .verifyEmail(token);
}


@Post('register')
@UseGuards(GuestTokenGuard)
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
  login(
    @Body()
    loginDto: LoginDto,
  ) {
    return this.authService.login(
      loginDto,
    );
  }

  @Post('refresh_token')
  refreshToken(
    @Body()
    dto: RefreshTokenDto,
  ) {
    return this.authService
      .refreshToken(
        dto.refreshToken,
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
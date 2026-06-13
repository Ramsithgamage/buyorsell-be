import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller() 
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService, 
  ) {}

  // Resolves to: POST localhost:3000/get_token
  @Post('get_token')
  getGuestToken() {
    return this.authService.getGuestToken();
  }

  // Resolves to: GET localhost:3000/profile
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Request() req) {
    return req.user;
  }
}
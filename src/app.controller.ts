import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Core')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('get_token')
  @ApiOperation({ summary: 'Generate a new Guest JWT token' })
  @ApiResponse({
    status: 201,
    description: 'Guest token generated successfully',
    schema: {
      example: {
        guestToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  getGuestToken() {
    return this.authService.getGuestToken();
  }

  // GET /profile now lives in UsersModule → ProfileController.
}

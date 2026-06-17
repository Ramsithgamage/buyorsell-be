import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import type { JwtPayload } from './auth/interfaces/jwt-payload.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserResponseDto } from './users/dto/user-response.dto';
import { ErrorResponseDto } from './common/dto/error-response.dto';
import { UserNotFoundException } from './common/exceptions';

@ApiTags('Core')
@Controller() 
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile details of the authenticated user' })
  @ApiResponse({
    status: 200,
    type: UserResponseDto,
    description: 'Authenticated user details returned successfully',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description: 'Missing or invalid JWT access token',
  })
  async profile(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    const userEntity = await this.usersService.findById(user.sub!);
    if (!userEntity) {
      throw new UserNotFoundException();
    }
    return {
      id: userEntity.id,
      firstName: userEntity.firstName,
      lastName: userEntity.lastName,
      email: userEntity.email,
    };
  }
}
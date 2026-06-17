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
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { GuestTokenGuard } from './guards/guest-token.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Get('verify')
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @ApiOperation({ summary: 'Verify user email address' })
  @ApiQuery({
    name: 'token',
    description: 'Email verification token sent to the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      example: { message: 'Email verified successfully' },
    },
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Invalid or expired verification token',
  })
  verifyEmail(
    @Query('token')
    token: string,
  ) {
    return this.authService.verifyEmail(token);
  }

  @Post('register')
  @UseGuards(GuestTokenGuard)
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new user account (Requires Guest Token)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    type: RegisterResponseDto,
    description: 'User registration successful',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Duplicate email, weak password, or mismatched passwords',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description: 'Missing or invalid guest token',
  })
  register(
    @Body()
    createUserDto: CreateUserDto,
  ) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @UseGuards(GuestTokenGuard)
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Authenticate a user and return access & refresh tokens (Requires Guest Token)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    type: LoginResponseDto,
    description: 'Authentication successful',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Email not verified',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description: 'Invalid credentials, or missing/invalid guest token',
  })
  login(
    @Body()
    loginDto: LoginDto,
  ) {
    return this.authService.login(loginDto);
  }

  @Post('refresh_token')
  @UseGuards(JwtRefreshGuard)
  @Throttle({ default: { limit: 10, ttl: 3600 } })
  @ApiOperation({ summary: 'Rotate JWT access and refresh tokens' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 201,
    type: RefreshTokenResponseDto,
    description: 'Tokens rotated successfully',
  })
  @ApiResponse({
    status: 400,
    type: ErrorResponseDto,
    description: 'Invalid body schema',
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description: 'Invalid, revoked, or expired refresh token',
  })
  refreshToken(
    @CurrentUser()
    user: any,
    @Body()
    dto: RefreshTokenDto,
  ) {
    return this.authService.refreshToken(user.id, user.email);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke user refresh token (Logout)' })
  @ApiResponse({
    status: 201,
    description: 'Logout successful',
    schema: {
      example: { message: 'Logout successful' },
    },
  })
  @ApiResponse({
    status: 401,
    type: ErrorResponseDto,
    description: 'Missing or invalid JWT access token',
  })
  logout(
    @Request()
    req: any,
  ) {
    return this.authService.logout(req.user.sub);
  }
}
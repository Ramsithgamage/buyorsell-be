import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { GuestSessionModule } from '../guest-session/guest-session.module';
import { VerificationModule } from '../verification/verification.module';
import { GuestTokenGuard } from './guards/guest-token.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtGuestStrategy } from './strategies/jwt-guest.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { TokenService } from './services/token.service';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UsersModule,
    VerificationModule,
    GuestSessionModule,
    JwtModule.register({}),
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    GuestTokenGuard,
    JwtAccessStrategy,
    JwtGuestStrategy,
    JwtRefreshStrategy,
    JwtRefreshGuard,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
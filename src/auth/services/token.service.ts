import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApprovalStatus } from '../../common/enums/approval-status.enum';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateGuestToken(guestId: string): Promise<string> {
    const payload = {
      guestId,
      type: 'guest',
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('GUEST_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('GUEST_TOKEN_EXPIRES_IN') as any,
    });
  }

  async generateAccessToken(
    userId: number,
    email: string,
    role: UserRole,
    approvalStatus: ApprovalStatus,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      type: 'access',
      role,
      approvalStatus,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') as any,
    });
  }

  async generateRefreshToken(
    userId: number,
    email: string,
    role: UserRole,
    approvalStatus: ApprovalStatus,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      type: 'refresh',
      role,
      approvalStatus,
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
    });
  }
}

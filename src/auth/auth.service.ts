import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GuestSessionService } from '../guest-session/guest-session.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { VerificationService } from 'src/verification/verification.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
constructor(
  private readonly usersService: UsersService,
  private readonly jwtService: JwtService,
  private readonly configService: ConfigService,
  private readonly guestSessionService: GuestSessionService,  
  private readonly verificationService: VerificationService,

) {}

  async register(
  createUserDto: CreateUserDto,
) {
  const existingUser =
    await this.usersService.findByEmail(
      createUserDto.email,
    );

  if (existingUser) {
    throw new BadRequestException(
      'Email already exists',
    );
  }

  const hashedPassword =
    await bcrypt.hash(
      createUserDto.password,
      10,
    );

  const user =
    await this.usersService.create({
      firstName:
        createUserDto.firstName,
      lastName:
        createUserDto.lastName,
      email:
        createUserDto.email,
      password: hashedPassword,
      status: 0,
    });

  const verificationToken =
    crypto.randomBytes(32)
      .toString('hex');

  const expiresAt = new Date();

  expiresAt.setHours(
    expiresAt.getHours() + 24,
  );

  await this.verificationService
    .createToken(
      verificationToken,
      user,
      expiresAt,
    );

  const verificationUrlBase =
    this.configService.get(
      'VERIFICATION_URL_BASE',
    );

  const verificationUrl =
    `${verificationUrlBase}/auth/verify?token=${verificationToken}`;

  if (
    this.configService.get('NODE_ENV') === 'development'
  ) {
    console.log(
      '\n==================================',
    );

    console.log(
      'EMAIL VERIFICATION LINK:',
    );

    console.log(
      verificationUrl,
    );

    console.log(
      '==================================\n',
    );
  }

  return {
    message:
      'Registration successful. Verify your email.',
  };
}

  async getGuestToken() 
  {
    const guestId = uuidv4();

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + 30,
    );

    await this.guestSessionService
      .createGuestSession(
        guestId,
        expiresAt,
      );

    const payload = {
      guestId,
      type: 'guest',
    };

    const token =
      await this.jwtService.signAsync(
        payload,
        {
          secret:
            this.configService.get(
              'GUEST_TOKEN_SECRET',
            ),

          expiresIn:
            this.configService.get(
              'GUEST_TOKEN_EXPIRES_IN',
            ),
        },
      );

    return {
      guestToken: token,
    };
  }

  private async generateAccessToken(
    userId: number,
    email: string,
  ) {
    const payload = {
      sub: userId,
      email,
    };

    return this.jwtService.signAsync(
      payload,
      {
        secret:
          this.configService.get(
            'JWT_ACCESS_SECRET',
          ),
        expiresIn:
          this.configService.get(
            'JWT_ACCESS_EXPIRES_IN',
          ),
      },
    );
  }

  private async generateRefreshToken(
    userId: number,
    email: string,
  ) {
    const payload = {
      sub: userId,
      email,
    };

    return this.jwtService.signAsync(
      payload,
      {
        secret:
          this.configService.get(
            'JWT_REFRESH_SECRET',
          ),
        expiresIn:
          this.configService.get(
            'JWT_REFRESH_EXPIRES_IN',
          ),
      },
    );
  }

  async refreshToken(
    refreshToken: string,
  ) {
    let payload;

    try {
      payload =
        await this.jwtService.verifyAsync(
          refreshToken,
          {
            secret:
              this.configService.get(
                'JWT_REFRESH_SECRET',
              ),
          },
        );
    } catch {
      throw new BadRequestException(
        'Invalid refresh token',
      );
    }

    const user =
      await this.usersService.findById(
        payload.sub,
      );

    if (!user) {
      throw new BadRequestException(
        'User not found',
      );
    }

    if (!user.refreshToken) {
      throw new BadRequestException(
        'Invalid refresh token',
      );
    }

    const tokenMatches =
      await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

    if (!tokenMatches) {
      throw new BadRequestException(
        'Invalid refresh token',
      );
    }

    const newAccessToken =
      await this.generateAccessToken(
        user.id,
        user.email,
      );

    const newRefreshToken =
      await this.generateRefreshToken(
        user.id,
        user.email,
      );

    const hashedRefreshToken =
      await bcrypt.hash(
        newRefreshToken,
        10,
      );

    await this.usersService
      .updateRefreshToken(
        user.id,
        hashedRefreshToken,
      );

    return {
      accessToken:
        newAccessToken,

      refreshToken:
        newRefreshToken,
    };
  }

  async login(
    loginDto: LoginDto,
  ) {
    const user =
      await this.usersService.findByEmail(
        loginDto.email,
      );

    if (!user) {
      throw new BadRequestException(
        'Invalid credentials',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        loginDto.password,
        user.password,
      );

    if (!passwordMatches) {
      throw new BadRequestException(
        'Invalid credentials',
      );
    }

    if (user.status !== 1) {
      throw new BadRequestException(
        'Email not verified',
      );
    }

    const accessToken =
      await this.generateAccessToken(
        user.id,
        user.email,
      );

    const refreshToken =
      await this.generateRefreshToken(
        user.id,
        user.email,
      );

    const hashedRefreshToken =
      await bcrypt.hash(
        refreshToken,
        10,
      );

    await this.usersService
      .updateRefreshToken(
        user.id,
        hashedRefreshToken,
      );

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(
    token: string,
  ) {
    return this.verificationService
      .verifyEmail(token);
  }

  async logout(
    userId: number,
  ) {
    await this.usersService.updateRefreshToken(
      userId,
      null,
    );

    return {
      message: 'Logout successful',
    };
  }

}
import {
  Injectable,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RegisterVendorDto } from '../users/dto/register-vendor.dto';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { GuestSessionService } from '../guest-session/guest-session.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { VerificationService } from 'src/verification/verification.service';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './services/token.service';
import { UserStatus } from '../common/enums/user-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ApprovalStatus } from '../common/enums/approval-status.enum';
import {
  DuplicateEmailException,
  InvalidTokenException,
  UserNotFoundException,
  InvalidCredentialsException,
  EmailNotVerifiedException,
} from '../common/exceptions';

@Injectable()
export class AuthService {
constructor(
  private readonly usersService: UsersService,
  private readonly configService: ConfigService,
  private readonly guestSessionService: GuestSessionService,  
  private readonly verificationService: VerificationService,
  private readonly tokenService: TokenService,

) {}

  async register(createUserDto: CreateUserDto) {
    return this.registerUserWithRole(createUserDto, UserRole.USER, ApprovalStatus.APPROVED);
  }

  async registerAdmin(createUserDto: CreateUserDto) {
    return this.registerUserWithRole(createUserDto, UserRole.ADMIN, ApprovalStatus.PENDING);
  }

  async registerVendor(registerVendorDto: RegisterVendorDto) {
    const existingUser = await this.usersService.findByEmail(registerVendorDto.email);
    if (existingUser) {
      throw new DuplicateEmailException();
    }

    const hashedPassword = await bcrypt.hash(registerVendorDto.password, 10);

    const user = await this.usersService.createVendor(
      {
        firstName: registerVendorDto.firstName,
        lastName: registerVendorDto.lastName,
        email: registerVendorDto.email,
        password: hashedPassword,
        status: UserStatus.UNVERIFIED,
      },
      {
        companyName: registerVendorDto.companyName,
        businessRegistrationNumber: registerVendorDto.businessRegistrationNumber,
      },
    );

    await this.sendVerificationEmail(user);

    return {
      message: 'Registration successful. Verify your email.',
    };
  }

  private async registerUserWithRole(
    createUserDto: CreateUserDto,
    role: UserRole,
    approvalStatus: ApprovalStatus,
  ) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new DuplicateEmailException();
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.usersService.create({
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      password: hashedPassword,
      status: UserStatus.UNVERIFIED,
      role,
      approvalStatus,
    });

    await this.sendVerificationEmail(user);

    return {
      message: 'Registration successful. Verify your email.',
    };
  }

  private async sendVerificationEmail(user: User) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.verificationService.createToken(
      verificationToken,
      user,
      expiresAt,
    );

    const verificationUrlBase = this.configService.get('VERIFICATION_URL_BASE');
    const verificationUrl = `${verificationUrlBase}/auth/verify?token=${verificationToken}`;

    if (this.configService.get('NODE_ENV') === 'development') {
      console.log('\n==================================');
      console.log('EMAIL VERIFICATION LINK:');
      console.log(verificationUrl);
      console.log('==================================\n');
    }
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

    const token = await this.tokenService.generateGuestToken(guestId);

    return {
      guestToken: token,
    };
  }

  async refreshToken(user: User) {
    const newAccessToken =
      await this.tokenService.generateAccessToken(
        user.id,
        user.email,
        user.role,
        user.approvalStatus,
      );

    const newRefreshToken =
      await this.tokenService.generateRefreshToken(
        user.id,
        user.email,
        user.role,
        user.approvalStatus,
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
      throw new InvalidCredentialsException();
    }

    const passwordMatches =
      await bcrypt.compare(
        loginDto.password,
        user.password,
      );

    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    if (user.status !== UserStatus.VERIFIED) {
      throw new EmailNotVerifiedException();
    }

    const accessToken =
      await this.tokenService.generateAccessToken(
        user.id,
        user.email,
        user.role,
        user.approvalStatus,
      );

    const refreshToken =
      await this.tokenService.generateRefreshToken(
        user.id,
        user.email,
        user.role,
        user.approvalStatus,
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
        role: user.role,
        approvalStatus: user.approvalStatus,
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
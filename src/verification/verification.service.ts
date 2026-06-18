import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { VerificationToken } from './entities/verification-token.entity';
import { InvalidTokenException, TokenExpiredException } from '../common/exceptions';
import { UserStatus } from '../common/enums/user-status.enum';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(
      VerificationToken,
    )
    private verificationRepository:
      Repository<VerificationToken>,

    private readonly usersService:
      UsersService,
  ) {}

  async createToken(
    token: string,
    user: any,
    expiresAt: Date,
  ) {
    // Delete any existing verification tokens for the user to prevent duplicates
    await this.verificationRepository.delete({ user: { id: user.id } });

    const verificationToken =
      this.verificationRepository.create({
        token,
        user,
        expiresAt,
      });

    return this.verificationRepository.save(
      verificationToken,
    );
  }

  async findByToken(token: string) {
    return this.verificationRepository.findOne({
      where: { token },
      relations: {user: true},
    });
  }

  async deleteToken(id: number) {
    return this.verificationRepository.delete(id);
  }

  async verifyEmail(token: string) {
    const verificationToken =
      await this.findByToken(token);

    if (!verificationToken) {
      throw new InvalidTokenException(
        'Invalid verification token',
      );
    }

    if (!verificationToken.user) {
      throw new BadRequestException(
        'User associated with this token not found',
      );
    }

    if (verificationToken.user.status === UserStatus.VERIFIED) {
      await this.deleteToken(verificationToken.id);
      throw new BadRequestException(
        'Email is already verified',
      );
    }

    const now = new Date();

    if (
      verificationToken.expiresAt < now
    ) {
      throw new TokenExpiredException();
    }

    await this.usersService.updateStatus(
      verificationToken.user.id,
      UserStatus.VERIFIED,
    );

    await this.deleteToken(
      verificationToken.id,
    );

    return {
      message:
        'Email verified successfully',
    };
  }

}
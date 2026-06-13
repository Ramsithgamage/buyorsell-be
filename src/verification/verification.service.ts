import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { VerificationToken } from './entities/verification-token.entity';
import { BadRequestException,} from '@nestjs/common';

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
      throw new BadRequestException(
        'Invalid verification token',
      );
    }

    const now = new Date();

    if (
      verificationToken.expiresAt < now
    ) {
      throw new BadRequestException(
        'Verification token expired',
      );
    }

    await this.usersService.updateStatus(
      verificationToken.user.id,
      1,
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
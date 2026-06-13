import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async findById(id: number) {
    return this.userRepository.findOne({
      where: {
        id,
      },
    });
}

  async create(userData: Partial<User>) {
    const user =
      this.userRepository.create(userData);

    return this.userRepository.save(user);
  }

  async updateStatus(
    userId: number,
    status: number,
  ) {
    await this.userRepository.update(
      userId,
      { status },
    );
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: any,
  ) {
    await this.userRepository.update(
      userId,
      {
        refreshToken,
      },
    );
  }


}
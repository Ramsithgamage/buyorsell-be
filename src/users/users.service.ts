import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { UserStatus } from '../common/enums/user-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ApprovalStatus } from '../common/enums/approval-status.enum';
import { VendorProfile } from './entities/vendor-profile.entity';
import { UserNotFoundException } from '../common/exceptions';

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
    status: UserStatus,
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

  async createVendor(
    userData: Partial<User>,
    vendorProfileData: { companyName: string; businessRegistrationNumber: string },
  ) {
    const user = this.userRepository.create({
      ...userData,
      role: UserRole.VENDOR,
      approvalStatus: ApprovalStatus.PENDING,
    });

    const vendorProfile = new VendorProfile();
    vendorProfile.companyName = vendorProfileData.companyName;
    vendorProfile.businessRegistrationNumber = vendorProfileData.businessRegistrationNumber;

    user.vendorProfile = vendorProfile;

    return this.userRepository.save(user);
  }

  async updateApprovalStatus(
    userId: number,
    approvalStatus: ApprovalStatus,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UserNotFoundException();
    }
    user.approvalStatus = approvalStatus;
    return this.userRepository.save(user);
  }
}
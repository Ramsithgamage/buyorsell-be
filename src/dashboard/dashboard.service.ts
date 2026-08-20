import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advertisement } from '../advertisements/entities/advertisement.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { ApprovalStatus } from '../common/enums/approval-status.enum';

export interface MyStats {
  totalAds: number;
  activeAds: number;
}

export interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  pendingApprovals: number;
  totalAds: number;
  activeAds: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Advertisement)
    private readonly adRepository: Repository<Advertisement>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ─── USER / VENDOR ─────────────────────────────────────────────────────────

  async getMyStats(userId: number): Promise<MyStats> {
    const [totalAds, activeAds] = await Promise.all([
      this.adRepository.count({ where: { userId } }),
      this.adRepository.count({ where: { userId, isActive: true } }),
    ]);
    return { totalAds, activeAds };
  }

  async getMyAds(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResult<Advertisement>> {
    const skip = (page - 1) * limit;
    const [data, totalItems] = await this.adRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  // ─── ADMIN ─────────────────────────────────────────────────────────────────

  async getAdminStats(): Promise<AdminStats> {
    const [totalUsers, totalVendors, pendingApprovals, totalAds, activeAds] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { role: UserRole.VENDOR } }),
        this.userRepository.count({
          where: { approvalStatus: ApprovalStatus.PENDING },
        }),
        this.adRepository.count(),
        this.adRepository.count({ where: { isActive: true } }),
      ]);
    return { totalUsers, totalVendors, pendingApprovals, totalAds, activeAds };
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 20,
    role?: UserRole,
  ): Promise<PaginatedResult<User>> {
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};
    const [data, totalItems] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        approvalStatus: true,
        status: true,
        createdAt: true,
      },
    });
    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async getPendingApprovals(): Promise<User[]> {
    return this.userRepository.find({
      where: { approvalStatus: ApprovalStatus.PENDING },
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
      },
    });
  }
}

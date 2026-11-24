import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { User } from './entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Advertisement } from '../advertisements/entities/advertisement.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { OrderStatus } from '../common/enums/order-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ApprovalStatus } from '../common/enums/approval-status.enum';
import { UserNotFoundException } from '../common/exceptions';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const AVATAR_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

/** Verifies the real file signature, since the client-supplied mime type is spoofable. */
function detectImageExtension(buf: Buffer): '.jpg' | '.png' | '.webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return '.jpg';
  if (
    buf.length >= 8 &&
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return '.png';
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  )
    return '.webp';
  return null;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  private toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt,
      vendorProfile: user.vendorProfile
        ? {
            companyName: user.vendorProfile.companyName,
            businessRegistrationNumber:
              user.vendorProfile.businessRegistrationNumber,
          }
        : null,
    };
  }

  private async loadUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { vendorProfile: true },
    });
    if (!user) throw new UserNotFoundException();
    return user;
  }

  async getProfile(userId: number): Promise<UserResponseDto> {
    return this.toResponse(await this.loadUser(userId));
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.loadUser(userId);
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    // Save only the changed scalar columns (avoid cascading into vendorProfile).
    await this.userRepository.update(userId, {
      firstName: user.firstName,
      lastName: user.lastName,
    });
    return this.toResponse(user);
  }

  // ── Avatar ────────────────────────────────────────────────────────────────

  private avatarPathFromUrl(url?: string | null): string | null {
    if (!url) return null;
    const file = path.basename(url.split('?')[0]);
    const full = path.join(AVATAR_DIR, file);
    // Only ever touch files inside the avatars directory.
    return full.startsWith(AVATAR_DIR + path.sep) ? full : null;
  }

  private async removeAvatarFile(url?: string | null): Promise<void> {
    const file = this.avatarPathFromUrl(url);
    if (!file) return;
    try {
      await fs.promises.unlink(file);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(
          `Failed to remove avatar file ${file}: ${String(err)}`,
        );
      }
    }
  }

  async setAvatar(
    userId: number,
    file: Express.Multer.File | undefined,
  ): Promise<UserResponseDto> {
    if (!file)
      throw new BadRequestException('An "avatar" image file is required');
    if (file.size > AVATAR_MAX_BYTES) {
      throw new BadRequestException('Avatar must be 2 MB or smaller');
    }
    const ext = detectImageExtension(file.buffer);
    if (!ext) {
      throw new BadRequestException('Avatar must be a JPEG, PNG or WebP image');
    }

    const user = await this.loadUser(userId);

    await fs.promises.mkdir(AVATAR_DIR, { recursive: true });
    const filename = `${userId}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    await fs.promises.writeFile(path.join(AVATAR_DIR, filename), file.buffer);

    const baseUrl =
      process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const previous = user.avatarUrl;
    user.avatarUrl = `${baseUrl}/uploads/avatars/${filename}`;
    await this.userRepository.update(userId, { avatarUrl: user.avatarUrl });
    await this.removeAvatarFile(previous);
    return this.toResponse(user);
  }

  async removeAvatar(userId: number): Promise<UserResponseDto> {
    const user = await this.loadUser(userId);
    const previous = user.avatarUrl;
    user.avatarUrl = null;
    await this.userRepository.update(userId, { avatarUrl: null });
    await this.removeAvatarFile(previous);
    return this.toResponse(user);
  }

  // ── Password ──────────────────────────────────────────────────────────────

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.loadUser(userId);
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    // Clearing the refresh token signs the user out everywhere once access tokens expire.
    await this.userRepository.update(userId, {
      password: hashed,
      refreshToken: null as unknown as undefined,
    });
    return { message: 'Password changed successfully. Please sign in again.' };
  }

  // ── Soft delete ───────────────────────────────────────────────────────────

  async deleteAccount(
    userId: number,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.loadUser(userId);

    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const previousAvatar = user.avatarUrl;
    const unusablePassword = await bcrypt.hash(
      crypto.randomBytes(32).toString('hex'),
      10,
    );

    await this.dataSource.transaction(async (manager) => {
      if (user.role === UserRole.ADMIN) {
        const otherAdmins = await manager
          .getRepository(User)
          .createQueryBuilder('u')
          .where('u.role = :role', { role: UserRole.ADMIN })
          .andWhere('u.approval_status = :status', {
            status: ApprovalStatus.APPROVED,
          })
          .andWhere('u.id != :id', { id: userId })
          .getCount();
        if (otherAdmins === 0) {
          throw new ConflictException(
            'You are the last active administrator and cannot delete your account.',
          );
        }
      }

      const pendingOrders = await manager.count(Order, {
        where: [
          { buyerId: userId, status: OrderStatus.PENDING },
          { sellerId: userId, status: OrderStatus.PENDING },
        ],
      });
      if (pendingOrders > 0) {
        throw new ConflictException(
          `You have ${pendingOrders} pending order(s). Resolve them before deleting your account.`,
        );
      }

      // Anonymize PII (the email change also frees the UNIQUE slot for re-registration).
      // vendor_profiles is intentionally left untouched.
      await manager.update(User, userId, {
        firstName: 'Deleted',
        lastName: 'User',
        email: `deleted_${userId}_${Date.now()}@deleted.invalid`,
        password: unusablePassword,
        refreshToken: null as unknown as undefined,
        avatarUrl: null,
      });
      await manager.update(Advertisement, { userId }, { isActive: false });
      await manager.delete(Notification, { userId });
      // softDelete (not softRemove) so TypeORM does not cascade into vendorProfile.
      await manager.softDelete(User, userId);
    });

    await this.removeAvatarFile(previousAvatar);
    return { message: 'Your account has been deleted.' };
  }
}

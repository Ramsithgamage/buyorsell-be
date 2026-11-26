import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { ProfileService } from './profile.service';
import { User } from './entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Advertisement } from '../advertisements/entities/advertisement.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { VendorProfile } from './entities/vendor-profile.entity';
import { OrderStatus } from '../common/enums/order-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ApprovalStatus } from '../common/enums/approval-status.enum';
import { UserNotFoundException } from '../common/exceptions';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const AVATAR_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0, 0, 0, 0]),
  Buffer.from('WEBP'),
]);

const makeFile = (buffer: Buffer, size = buffer.length): Express.Multer.File =>
  ({ buffer, size, mimetype: 'image/jpeg' }) as Express.Multer.File;

describe('ProfileService', () => {
  let service: ProfileService;
  let userRepo: { findOne: jest.Mock; update: jest.Mock };
  let manager: {
    getRepository: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    softDelete: jest.Mock;
  };
  let adminCount: jest.Mock;
  let dataSource: { transaction: jest.Mock };

  const bcryptCompare = bcrypt.compare as jest.Mock;
  const bcryptHash = bcrypt.hash as jest.Mock;

  const makeUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 7,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashed-pw',
      role: UserRole.USER,
      approvalStatus: ApprovalStatus.APPROVED,
      avatarUrl: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      vendorProfile: null,
      ...overrides,
    }) as unknown as User;

  let writeFile: jest.SpyInstance;
  let mkdir: jest.SpyInstance;
  let unlink: jest.SpyInstance;

  beforeEach(async () => {
    userRepo = { findOne: jest.fn(), update: jest.fn() };

    adminCount = jest.fn().mockResolvedValue(1);
    const qb: Record<string, jest.Mock> = {};
    qb.where = jest.fn().mockReturnValue(qb);
    qb.andWhere = jest.fn().mockReturnValue(qb);
    qb.getCount = adminCount;
    manager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(qb),
      }),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
    };

    bcryptCompare.mockReset().mockResolvedValue(true);
    bcryptHash.mockReset().mockResolvedValue('new-hash');

    mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();
    unlink = jest.spyOn(fs.promises, 'unlink').mockResolvedValue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    service = module.get(ProfileService);
  });

  afterEach(() => jest.restoreAllMocks());

  // ── getProfile ──────────────────────────────────────────────────────────
  describe('getProfile', () => {
    it('throws when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getProfile(1)).rejects.toBeInstanceOf(
        UserNotFoundException,
      );
    });

    it('never exposes password or refresh token and nulls missing vendor data', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ refreshToken: 'secret' }));
      const result = await service.getProfile(7);
      expect(result).toEqual({
        id: 7,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: UserRole.USER,
        approvalStatus: ApprovalStatus.APPROVED,
        avatarUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        vendorProfile: null,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('includes vendor business details for vendors', async () => {
      userRepo.findOne.mockResolvedValue(
        makeUser({
          role: UserRole.VENDOR,
          vendorProfile: {
            id: 1,
            companyName: 'Acme',
            businessRegistrationNumber: 'BRN-1',
          } as VendorProfile,
        }),
      );
      const result = await service.getProfile(7);
      expect(result.vendorProfile).toEqual({
        companyName: 'Acme',
        businessRegistrationNumber: 'BRN-1',
      });
    });
  });

  // ── updateProfile ───────────────────────────────────────────────────────
  describe('updateProfile', () => {
    it('updates only the provided name fields', async () => {
      userRepo.findOne.mockResolvedValue(makeUser());
      const result = await service.updateProfile(7, { firstName: 'Jane' });
      expect(userRepo.update).toHaveBeenCalledWith(7, {
        firstName: 'Jane',
        lastName: 'Doe',
      });
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Doe');
    });
  });

  // ── setAvatar ───────────────────────────────────────────────────────────
  describe('setAvatar', () => {
    it('rejects a missing file', async () => {
      await expect(service.setAvatar(7, undefined)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects files larger than 2 MB', async () => {
      await expect(
        service.setAvatar(7, makeFile(JPEG, 2 * 1024 * 1024 + 1)),
      ).rejects.toThrow('2 MB');
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('rejects content that is not a real JPEG/PNG/WebP image', async () => {
      await expect(
        service.setAvatar(
          7,
          makeFile(Buffer.from('<script>alert(1)</script>')),
        ),
      ).rejects.toThrow('JPEG, PNG or WebP');
      expect(writeFile).not.toHaveBeenCalled();
    });

    it.each([
      ['jpeg', JPEG, '.jpg'],
      ['png', PNG, '.png'],
      ['webp', WEBP, '.webp'],
    ])(
      'stores a %s avatar with the detected extension',
      async (_n, buf, ext) => {
        userRepo.findOne.mockResolvedValue(makeUser());
        const result = await service.setAvatar(7, makeFile(buf));

        expect(mkdir).toHaveBeenCalledWith(AVATAR_DIR, { recursive: true });
        const [writtenPath] = writeFile.mock.calls[0] as [string, Buffer];
        expect(path.dirname(writtenPath)).toBe(AVATAR_DIR);
        expect(writtenPath.endsWith(ext)).toBe(true);
        expect(result.avatarUrl).toMatch(/\/uploads\/avatars\/7-\d+-[0-9a-f]+/);
        expect(userRepo.update).toHaveBeenCalledWith(7, {
          avatarUrl: result.avatarUrl,
        });
      },
    );

    it('deletes the previous avatar file after saving the new one', async () => {
      userRepo.findOne.mockResolvedValue(
        makeUser({ avatarUrl: 'http://x/uploads/avatars/old.jpg' }),
      );
      await service.setAvatar(7, makeFile(JPEG));
      expect(unlink).toHaveBeenCalledWith(path.join(AVATAR_DIR, 'old.jpg'));
    });

    it('does not delete files outside the avatars directory', async () => {
      userRepo.findOne.mockResolvedValue(
        makeUser({ avatarUrl: 'http://x/uploads/..%2f..%2fsecret.txt' }),
      );
      await service.setAvatar(7, makeFile(JPEG));
      for (const [p] of unlink.mock.calls as [string][]) {
        expect(p.startsWith(AVATAR_DIR + path.sep)).toBe(true);
      }
    });

    it('ignores a missing old file (ENOENT)', async () => {
      unlink.mockRejectedValue(
        Object.assign(new Error('gone'), { code: 'ENOENT' }),
      );
      userRepo.findOne.mockResolvedValue(
        makeUser({ avatarUrl: 'http://x/uploads/avatars/old.jpg' }),
      );
      await expect(service.setAvatar(7, makeFile(JPEG))).resolves.toBeDefined();
    });
  });

  // ── removeAvatar ────────────────────────────────────────────────────────
  describe('removeAvatar', () => {
    it('clears the URL and deletes the file', async () => {
      userRepo.findOne.mockResolvedValue(
        makeUser({ avatarUrl: 'http://x/uploads/avatars/a.png' }),
      );
      const result = await service.removeAvatar(7);
      expect(userRepo.update).toHaveBeenCalledWith(7, { avatarUrl: null });
      expect(unlink).toHaveBeenCalledWith(path.join(AVATAR_DIR, 'a.png'));
      expect(result.avatarUrl).toBeNull();
    });
  });

  // ── changePassword ──────────────────────────────────────────────────────
  describe('changePassword', () => {
    const dto = {
      currentPassword: 'Old@Pass1',
      newPassword: 'New@Pass1',
      newPasswordConfirm: 'New@Pass1',
    };

    beforeEach(() => userRepo.findOne.mockResolvedValue(makeUser()));

    it('rejects a wrong current password', async () => {
      bcryptCompare.mockResolvedValue(false);
      await expect(service.changePassword(7, dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('rejects reusing the current password', async () => {
      await expect(
        service.changePassword(7, {
          ...dto,
          newPassword: dto.currentPassword,
          newPasswordConfirm: dto.currentPassword,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(userRepo.update).not.toHaveBeenCalled();
    });

    it('stores a hash and revokes the refresh token', async () => {
      await service.changePassword(7, dto);
      expect(bcryptHash).toHaveBeenCalledWith('New@Pass1', 10);
      expect(userRepo.update).toHaveBeenCalledWith(7, {
        password: 'new-hash',
        refreshToken: null,
      });
    });
  });

  // ── deleteAccount ───────────────────────────────────────────────────────
  describe('deleteAccount', () => {
    beforeEach(() =>
      userRepo.findOne.mockResolvedValue(
        makeUser({ avatarUrl: 'http://x/uploads/avatars/me.jpg' }),
      ),
    );

    it('rejects a wrong password before touching anything', async () => {
      bcryptCompare.mockResolvedValue(false);
      await expect(service.deleteAccount(7, 'bad')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('blocks deletion while the user has pending orders', async () => {
      manager.count.mockResolvedValue(2);
      await expect(service.deleteAccount(7, 'pw')).rejects.toThrow(
        /2 pending order/,
      );
      expect(manager.count).toHaveBeenCalledWith(Order, {
        where: [
          { buyerId: 7, status: OrderStatus.PENDING },
          { sellerId: 7, status: OrderStatus.PENDING },
        ],
      });
      expect(manager.update).not.toHaveBeenCalled();
      expect(manager.softDelete).not.toHaveBeenCalled();
      expect(unlink).not.toHaveBeenCalled();
    });

    it('blocks the last active administrator', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ role: UserRole.ADMIN }));
      adminCount.mockResolvedValue(0);
      await expect(service.deleteAccount(7, 'pw')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(manager.softDelete).not.toHaveBeenCalled();
    });

    it('lets an admin delete when another active admin exists', async () => {
      userRepo.findOne.mockResolvedValue(makeUser({ role: UserRole.ADMIN }));
      adminCount.mockResolvedValue(1);
      await expect(service.deleteAccount(7, 'pw')).resolves.toEqual({
        message: expect.any(String) as string,
      });
      expect(manager.softDelete).toHaveBeenCalledWith(User, 7);
    });

    it('anonymizes, hides ads, removes notifications and soft-deletes', async () => {
      await service.deleteAccount(7, 'pw');

      expect(manager.update).toHaveBeenCalledWith(
        User,
        7,
        expect.objectContaining({
          firstName: 'Deleted',
          lastName: 'User',
          password: 'new-hash',
          refreshToken: null,
          avatarUrl: null,
          email: expect.stringMatching(
            /^deleted_7_\d+@deleted\.invalid$/,
          ) as string,
        }),
      );
      expect(manager.update).toHaveBeenCalledWith(
        Advertisement,
        { userId: 7 },
        { isActive: false },
      );
      expect(manager.delete).toHaveBeenCalledWith(Notification, { userId: 7 });
      expect(manager.softDelete).toHaveBeenCalledWith(User, 7);
    });

    it('keeps the vendor_profiles row untouched', async () => {
      await service.deleteAccount(7, 'pw');
      const touched = (
        [
          manager.update.mock.calls,
          manager.delete.mock.calls,
          manager.softDelete.mock.calls,
        ] as unknown[][][]
      )
        .flat()
        .map((c) => c[0]);
      expect(touched).not.toContain(VendorProfile);
    });

    it('removes the avatar file only after the transaction succeeds', async () => {
      await service.deleteAccount(7, 'pw');
      expect(unlink).toHaveBeenCalledWith(path.join(AVATAR_DIR, 'me.jpg'));
    });
  });
});

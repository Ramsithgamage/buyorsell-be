import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { TokenService } from './services/token.service';
import { UsersService } from '../users/users.service';
import { GuestSessionService } from '../guest-session/guest-session.service';
import { VerificationService } from '../verification/verification.service';
import { UserStatus } from '../common/enums/user-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ApprovalStatus } from '../common/enums/approval-status.enum';
import {
  EmailNotVerifiedException,
  InvalidCredentialsException,
} from '../common/exceptions';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: jest.fn(),
    updateRefreshToken: jest.fn(),
  };
  const tokenService = {
    generateAccessToken: jest.fn().mockResolvedValue('access'),
    generateRefreshToken: jest.fn().mockResolvedValue('refresh'),
  };

  const makeUser = async (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: await bcrypt.hash('P@ssw0rd123!', 4),
    status: UserStatus.VERIFIED,
    role: UserRole.USER,
    approvalStatus: ApprovalStatus.APPROVED,
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: GuestSessionService, useValue: {} },
        { provide: VerificationService, useValue: {} },
        { provide: TokenService, useValue: tokenService },
        { provide: MailerService, useValue: { sendMail: jest.fn() } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const dto = { email: 'john@example.com', password: 'P@ssw0rd123!' };

    it('rejects unknown emails (including soft-deleted users)', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toBeInstanceOf(
        InvalidCredentialsException,
      );
    });

    it('rejects a wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(await makeUser());
      await expect(
        service.login({ ...dto, password: 'wrong' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsException);
    });

    it('rejects unverified emails', async () => {
      usersService.findByEmail.mockResolvedValue(
        await makeUser({ status: UserStatus.UNVERIFIED }),
      );
      await expect(service.login(dto)).rejects.toBeInstanceOf(
        EmailNotVerifiedException,
      );
    });

    it('returns tokens and stores a hashed refresh token', async () => {
      usersService.findByEmail.mockResolvedValue(await makeUser());
      const result = await service.login(dto);
      expect(result.accessToken).toBe('access');
      expect(result.refreshToken).toBe('refresh');
      expect(result.user.email).toBe('john@example.com');
      const [, stored] = usersService.updateRefreshToken.mock.calls[0] as [
        number,
        string,
      ];
      expect(stored).not.toBe('refresh');
      await expect(bcrypt.compare('refresh', stored)).resolves.toBe(true);
    });
  });

  describe('logout', () => {
    it('clears the stored refresh token', async () => {
      await service.logout(5);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(5, null);
    });
  });
});

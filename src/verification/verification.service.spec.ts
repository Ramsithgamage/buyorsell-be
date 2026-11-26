import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationToken } from './entities/verification-token.entity';
import { UsersService } from '../users/users.service';

describe('VerificationService', () => {
  let service: VerificationService;
  const repo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        { provide: getRepositoryToken(VerificationToken), useValue: repo },
        { provide: UsersService, useValue: { updateStatus: jest.fn() } },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('createToken replaces any existing token for the user', async () => {
    repo.create.mockReturnValue({ token: 't' });
    await service.createToken('t', { id: 9 }, new Date());
    expect(repo.delete).toHaveBeenCalledWith({ user: { id: 9 } });
    expect(repo.save).toHaveBeenCalledWith({ token: 't' });
  });
});

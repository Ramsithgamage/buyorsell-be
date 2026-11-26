import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GuestSessionService } from './guest-session.service';
import { GuestSession } from './entities/guest-session.entity';

describe('GuestSessionService', () => {
  let service: GuestSessionService;
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
        GuestSessionService,
        { provide: getRepositoryToken(GuestSession), useValue: repo },
      ],
    }).compile();

    service = module.get<GuestSessionService>(GuestSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByGuestId', () => {
    it('returns null when no session exists', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByGuestId('g1')).resolves.toBeNull();
    });

    it('returns null for expired sessions', async () => {
      repo.findOne.mockResolvedValue({
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.findByGuestId('g1')).resolves.toBeNull();
    });

    it('returns active sessions', async () => {
      const session = { expiresAt: new Date(Date.now() + 60_000) };
      repo.findOne.mockResolvedValue(session);
      await expect(service.findByGuestId('g1')).resolves.toBe(session);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { GuestSessionService } from './guest-session.service';

describe('GuestSessionService', () => {
  let service: GuestSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GuestSessionService],
    }).compile();

    service = module.get<GuestSessionService>(GuestSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

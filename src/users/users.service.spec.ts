import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  const userRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findById looks users up by primary key (soft-deleted rows are excluded by TypeORM)', async () => {
    userRepository.findOne.mockResolvedValue({ id: 3 });
    await expect(service.findById(3)).resolves.toEqual({ id: 3 });
    expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
  });

  it('findByIdWithVendorProfile loads the vendor relation', async () => {
    await service.findByIdWithVendorProfile(3);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 3 },
      relations: { vendorProfile: true },
    });
  });
});

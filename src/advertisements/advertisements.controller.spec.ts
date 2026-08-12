import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AdvertisementsController } from './advertisements.controller';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { Advertisement } from './entities/advertisement.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

import { GetAdvertisementsDto } from './dto/get-advertisements.dto';

describe('AdvertisementsController', () => {
  let controller: AdvertisementsController;
  let service: jest.Mocked<AdvertisementsService>;
  let cacheManager: any;

  const mockAdsService = () => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  });

  const mockCacheManager = () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    clear: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvertisementsController],
      providers: [
        {
          provide: AdvertisementsService,
          useFactory: mockAdsService,
        },
        {
          provide: CACHE_MANAGER,
          useFactory: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<AdvertisementsController>(AdvertisementsController);
    service = module.get(AdvertisementsService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe('findAll', () => {
    it('should return from cache if it exists', async () => {
      const cachedData = {
        data: [{ id: 1, title: 'Ad 1' }],
        meta: {
          totalItems: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };
      cacheManager.get.mockResolvedValue(cachedData);

      const query: GetAdvertisementsDto = { page: 1, limit: 10 };
      const result = await controller.findAll(query);
      expect(result).toEqual(cachedData);
      expect(cacheManager.get).toHaveBeenCalledWith('advertisements_list_p_1_l_10');
      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should query service and set cache if not cached', async () => {
      const freshData = [{ id: 1, title: 'Ad 1', price: 100, slug: 'ad-1' }] as Advertisement[];
      cacheManager.get.mockResolvedValue(null);
      service.findAll.mockResolvedValue({ data: freshData, total: 1 });

      const query: GetAdvertisementsDto = { page: 1, limit: 10 };
      const result = await controller.findAll(query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Ad 1');
      expect(cacheManager.set).toHaveBeenCalledWith('advertisements_list_p_1_l_10', expect.any(Object));
    });
  });

  describe('create', () => {
    it('should create an advertisement and evict cache', async () => {
      const dto = { title: 'New Ad', description: 'desc', price: 50, categoryId: 1 } as CreateAdDto;
      const user = { sub: 1 } as JwtPayload;
      const mockResult = { id: 1, ...dto, userId: 1, slug: 'new-ad-123' } as Advertisement;

      service.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto, user, []);
      expect(result.id).toBe(1);
      expect(service.create).toHaveBeenCalledWith(dto, 1, []);
      expect(cacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an advertisement and evict cache', async () => {
      const dto = { title: 'Updated Ad' } as UpdateAdDto;
      const user = { sub: 1 } as JwtPayload;
      const mockResult = { id: 1, title: 'Updated Ad', userId: 1, slug: 'updated-ad-123' } as Advertisement;

      service.update.mockResolvedValue(mockResult);

      const result = await controller.update(1, dto, user, []);
      expect(result.title).toBe('Updated Ad');
      expect(service.update).toHaveBeenCalledWith(1, dto, 1, []);
      expect(cacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove advertisement and evict cache', async () => {
      const user = { sub: 1 } as JwtPayload;
      service.remove.mockResolvedValue(undefined);

      await expect(controller.remove(1, user)).resolves.not.toThrow();
      expect(service.remove).toHaveBeenCalledWith(1, user);
      expect(cacheManager.clear).toHaveBeenCalled();
    });
  });
});

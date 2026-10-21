import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PromotionalAdsController } from './promotional-ads.controller';
import { PromotionalAdsService } from './promotional-ads.service';
import { PromotionalAd } from './entities/promotional-ad.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

describe('PromotionalAdsController', () => {
  let controller: PromotionalAdsController;
  let service: jest.Mocked<PromotionalAdsService>;
  let cacheManager: any;

  const mockPromoService = () => ({
    findAllActive: jest.fn(),
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
      controllers: [PromotionalAdsController],
      providers: [
        {
          provide: PromotionalAdsService,
          useFactory: mockPromoService,
        },
        {
          provide: CACHE_MANAGER,
          useFactory: mockCacheManager,
        },
      ],
    }).compile();

    controller = module.get<PromotionalAdsController>(PromotionalAdsController);
    service = module.get(PromotionalAdsService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  describe('findActive', () => {
    it('should return from cache if cached', async () => {
      const cached = [{ id: 1, linkUrl: 'https://test.com' }];
      cacheManager.get.mockResolvedValue(cached);

      const result = await controller.findActive();
      expect(result).toEqual(cached);
      expect(service.findAllActive).not.toHaveBeenCalled();
    });

    it('should fetch from service and cache if not cached', async () => {
      const fresh = [
        {
          id: 1,
          image: 'http://localhost/test.jpg',
          linkUrl: 'https://test.com',
          startDate: new Date(),
          endDate: new Date(),
          isActive: true,
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as PromotionalAd,
      ];
      cacheManager.get.mockResolvedValue(null);
      service.findAllActive.mockResolvedValue(fresh);

      const result = await controller.findActive();
      expect(result).toHaveLength(1);
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all promotional ads for admin', async () => {
      const all = [{ id: 1, linkUrl: 'https://test.com' } as PromotionalAd];
      service.findAll.mockResolvedValue(all);

      const result = await controller.findAll();
      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create promotional ad and evict cache', async () => {
      const dto = {
        linkUrl: 'https://test.com',
        startDate: '2026-10-14T00:00:00.000Z',
        endDate: '2026-10-21T00:00:00.000Z',
      };
      const user = { sub: 1 } as JwtPayload;
      const mockFile = {} as Express.Multer.File;
      const mockResult = {
        id: 1,
        ...dto,
        image: 'http://img.com',
        createdBy: 1,
      } as any;

      service.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto, user, mockFile);
      expect(result.id).toBe(1);
      expect(cacheManager.del).toHaveBeenCalledWith('promo_ads_active');
    });
  });

  describe('remove', () => {
    it('should remove promotional ad and evict cache', async () => {
      service.remove.mockResolvedValue(undefined);

      await expect(controller.remove(1)).resolves.not.toThrow();
      expect(service.remove).toHaveBeenCalledWith(1);
      expect(cacheManager.del).toHaveBeenCalledWith('promo_ads_active');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PromotionalAdsService } from './promotional-ads.service';
import { PromotionalAd } from './entities/promotional-ad.entity';

describe('PromotionalAdsService', () => {
  let service: PromotionalAdsService;
  let promoRepository: jest.Mocked<Repository<PromotionalAd>>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockPromoRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionalAdsService,
        {
          provide: getRepositoryToken(PromotionalAd),
          useFactory: mockPromoRepository,
        },
      ],
    }).compile();

    service = module.get<PromotionalAdsService>(PromotionalAdsService);
    promoRepository = module.get(getRepositoryToken(PromotionalAd));
  });

  describe('create', () => {
    it('should throw BadRequestException if no image file is provided', async () => {
      const dto = {
        linkUrl: 'https://example.com',
        startDate: '2026-10-14T00:00:00.000Z',
        endDate: '2026-10-21T00:00:00.000Z',
      };

      await expect(service.create(dto, 1, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if endDate is before startDate', async () => {
      const dto = {
        linkUrl: 'https://example.com',
        startDate: '2026-10-21T00:00:00.000Z',
        endDate: '2026-10-14T00:00:00.000Z',
      };
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('fake image'),
      } as Express.Multer.File;

      await expect(service.create(dto, 1, mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create and save promotional ad when inputs are valid', async () => {
      const dto = {
        linkUrl: 'https://example.com/promo',
        startDate: '2026-10-14T00:00:00.000Z',
        endDate: '2026-10-21T00:00:00.000Z',
        isActive: true,
      };
      const mockFile = {
        originalname: 'banner.png',
        buffer: Buffer.from('fake image data'),
      } as Express.Multer.File;

      const mockSaved = {
        id: 1,
        image: 'http://localhost:3000/uploads/promo-mock.png',
        linkUrl: dto.linkUrl,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: true,
        createdBy: 1,
      } as PromotionalAd;

      promoRepository.create.mockReturnValue(mockSaved);
      promoRepository.save.mockResolvedValue(mockSaved);

      const result = await service.create(dto, 1, mockFile);
      expect(result).toEqual(mockSaved);
      expect(promoRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAllActive', () => {
    it('should filter active promos with dates within current time', async () => {
      const mockActive = [
        { id: 1, linkUrl: 'https://test.com' } as PromotionalAd,
      ];
      mockQueryBuilder.getMany.mockResolvedValue(mockActive);

      const result = await service.findAllActive();
      expect(result).toEqual(mockActive);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'promo.isActive = :isActive',
        { isActive: true },
      );
    });
  });

  describe('findOne', () => {
    it('should return promotional ad by ID', async () => {
      const mockPromo = { id: 1, linkUrl: 'https://test.com' } as PromotionalAd;
      promoRepository.findOne.mockResolvedValue(mockPromo);

      const result = await service.findOne(1);
      expect(result).toEqual(mockPromo);
    });

    it('should throw NotFoundException if promotional ad does not exist', async () => {
      promoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if updated endDate is before startDate', async () => {
      const existing = {
        id: 1,
        startDate: new Date('2026-10-14T00:00:00.000Z'),
        endDate: new Date('2026-10-21T00:00:00.000Z'),
      } as PromotionalAd;
      promoRepository.findOne.mockResolvedValue(existing);

      await expect(
        service.update(1, { endDate: '2026-10-10T00:00:00.000Z' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update promo attributes successfully', async () => {
      const existing = {
        id: 1,
        linkUrl: 'https://old.com',
        startDate: new Date('2026-10-14T00:00:00.000Z'),
        endDate: new Date('2026-10-21T00:00:00.000Z'),
        isActive: true,
      } as PromotionalAd;

      promoRepository.findOne.mockResolvedValue(existing);
      promoRepository.save.mockImplementation((entity) => Promise.resolve(entity as PromotionalAd));

      const result = await service.update(1, {
        linkUrl: 'https://new.com',
        isActive: false,
      });
      expect(result.linkUrl).toBe('https://new.com');
      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should remove the promotional ad record', async () => {
      const existing = {
        id: 1,
        image: 'http://localhost:3000/uploads/test.jpg',
      } as PromotionalAd;
      promoRepository.findOne.mockResolvedValue(existing);
      promoRepository.remove.mockResolvedValue(existing);

      await service.remove(1);
      expect(promoRepository.remove).toHaveBeenCalledWith(existing);
    });
  });
});

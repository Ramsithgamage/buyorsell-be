import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AdvertisementsService } from './advertisements.service';
import { Advertisement } from './entities/advertisement.entity';
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/entities/category.entity';

describe('AdvertisementsService', () => {
  let service: AdvertisementsService;
  let adRepository: jest.Mocked<Repository<Advertisement>>;
  let categoriesService: jest.Mocked<CategoriesService>;

  const mockAdRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  const mockCategoriesService = () => ({
    findById: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertisementsService,
        {
          provide: getRepositoryToken(Advertisement),
          useFactory: mockAdRepository,
        },
        {
          provide: CategoriesService,
          useFactory: mockCategoriesService,
        },
      ],
    }).compile();

    service = module.get<AdvertisementsService>(AdvertisementsService);
    adRepository = module.get(getRepositoryToken(Advertisement));
    categoriesService = module.get(CategoriesService);
  });

  describe('create', () => {
    it('should create an advertisement if the category exists and is active', async () => {
      const dto = {
        title: 'iPhone 15',
        description: 'New iPhone',
        price: 999,
        categoryId: 1,
      };
      const mockCategory = { id: 1, name: 'Phones', isActive: true } as Category;
      const mockAd = { id: 1, ...dto, userId: 1, slug: 'iphone-15-123456' } as Advertisement;

      categoriesService.findById.mockResolvedValue(mockCategory);
      adRepository.create.mockReturnValue(mockAd);
      adRepository.save.mockResolvedValue(mockAd);

      const result = await service.create(dto, 1);
      expect(result).toEqual(mockAd);
      expect(categoriesService.findById).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException if the category is inactive', async () => {
      const dto = {
        title: 'iPhone 15',
        description: 'New iPhone',
        price: 999,
        categoryId: 1,
      };
      const mockCategory = { id: 1, name: 'Phones', isActive: false } as Category;

      categoriesService.findById.mockResolvedValue(mockCategory);

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if the category does not exist', async () => {
      const dto = {
        title: 'iPhone 15',
        description: 'New iPhone',
        price: 999,
        categoryId: 999,
      };

      categoriesService.findById.mockRejectedValue(new NotFoundException());

      await expect(service.create(dto, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an advertisement if the user owns it', async () => {
      const mockAd = { id: 1, title: 'Old Title', userId: 1, categoryId: 1 } as Advertisement;
      const dto = { title: 'New Title' };
      const updatedAd = { ...mockAd, title: 'New Title', slug: 'new-title-123' };

      adRepository.findOne.mockResolvedValue(mockAd);
      adRepository.save.mockResolvedValue(updatedAd);

      const result = await service.update(1, dto, 1);
      expect(result.title).toBe('New Title');
    });

    it('should throw ForbiddenException if user does not own the advertisement', async () => {
      const mockAd = { id: 1, title: 'Old Title', userId: 2, categoryId: 1 } as Advertisement;
      const dto = { title: 'New Title' };

      adRepository.findOne.mockResolvedValue(mockAd);

      await expect(service.update(1, dto, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove an advertisement if user owns it', async () => {
      const mockAd = { id: 1, userId: 1 } as Advertisement;
      adRepository.findOne.mockResolvedValue(mockAd);
      adRepository.remove.mockResolvedValue(mockAd);

      await expect(service.remove(1, 1)).resolves.not.toThrow();
      expect(adRepository.remove).toHaveBeenCalledWith(mockAd);
    });

    it('should throw ForbiddenException if user does not own the advertisement', async () => {
      const mockAd = { id: 1, userId: 2 } as Advertisement;
      adRepository.findOne.mockResolvedValue(mockAd);

      await expect(service.remove(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('handleDbError translation', () => {
    it('should translate foreign key violation to NotFoundException', async () => {
      const dto = {
        title: 'iPhone 15',
        description: 'New iPhone',
        price: 999,
        categoryId: 1,
      };
      const mockCategory = { id: 1, name: 'Phones', isActive: true } as Category;
      categoriesService.findById.mockResolvedValue(mockCategory);
      adRepository.create.mockReturnValue({} as any);
      
      const dbError = new Error('foreign key constraint fails');
      (dbError as any).code = 'ER_NO_REFERENCED_ROW_2';
      adRepository.save.mockRejectedValue(dbError);

      await expect(service.create(dto, 1)).rejects.toThrow(NotFoundException);
    });
  });
});

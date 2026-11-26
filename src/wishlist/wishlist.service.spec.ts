import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Advertisement } from '../advertisements/entities/advertisement.entity';

describe('WishlistService', () => {
  let service: WishlistService;
  const wishlistRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((v: unknown) => v),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const adRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: getRepositoryToken(WishlistItem), useValue: wishlistRepo },
        { provide: getRepositoryToken(Advertisement), useValue: adRepo },
      ],
    }).compile();
    service = module.get(WishlistService);
  });

  describe('add', () => {
    it('throws 404 when the ad does not exist', async () => {
      adRepo.findOne.mockResolvedValue(null);
      await expect(service.add(1, 99)).rejects.toThrow(NotFoundException);
    });

    it('throws 400 for the own advertisement', async () => {
      adRepo.findOne.mockResolvedValue({ id: 5, userId: 1 });
      await expect(service.add(1, 5)).rejects.toThrow(BadRequestException);
      expect(wishlistRepo.save).not.toHaveBeenCalled();
    });

    it('saves a new item', async () => {
      adRepo.findOne.mockResolvedValue({ id: 5, userId: 2 });
      wishlistRepo.findOne.mockResolvedValue(null);
      await expect(service.add(1, 5)).resolves.toEqual({ advertisementId: 5 });
      expect(wishlistRepo.save).toHaveBeenCalledTimes(1);
    });

    it('is idempotent when already wishlisted', async () => {
      adRepo.findOne.mockResolvedValue({ id: 5, userId: 2 });
      wishlistRepo.findOne.mockResolvedValue({ id: 1 });
      await service.add(1, 5);
      expect(wishlistRepo.save).not.toHaveBeenCalled();
    });

    it('swallows duplicate-entry races', async () => {
      adRepo.findOne.mockResolvedValue({ id: 5, userId: 2 });
      wishlistRepo.findOne.mockResolvedValue(null);
      wishlistRepo.save.mockRejectedValue({ code: 'ER_DUP_ENTRY' });
      await expect(service.add(1, 5)).resolves.toEqual({ advertisementId: 5 });
    });
  });

  describe('remove / clear', () => {
    it('removes one item for the user', async () => {
      await service.remove(1, 5);
      expect(wishlistRepo.delete).toHaveBeenCalledWith({
        userId: 1,
        advertisementId: 5,
      });
    });

    it('clears all items for the user', async () => {
      await service.clear(1);
      expect(wishlistRepo.delete).toHaveBeenCalledWith({ userId: 1 });
    });
  });

  describe('findIds', () => {
    it('returns advertisement ids', async () => {
      wishlistRepo.find.mockResolvedValue([
        { advertisementId: 3 },
        { advertisementId: 7 },
      ]);
      await expect(service.findIds(1)).resolves.toEqual([3, 7]);
    });
  });

  describe('findAll', () => {
    it('paginates and returns meta', async () => {
      wishlistRepo.findAndCount.mockResolvedValue([
        [
          {
            id: 1,
            advertisementId: 3,
            createdAt: new Date(),
            advertisement: { id: 3, title: 'T', isActive: false },
          },
        ],
        25,
      ]);
      const res = await service.findAll(1, { page: 2, limit: 10 });
      expect(wishlistRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10, where: { userId: 1 } }),
      );
      expect(res.meta).toEqual({
        totalItems: 25,
        itemCount: 1,
        itemsPerPage: 10,
        totalPages: 3,
        currentPage: 2,
      });
      expect(res.data[0].advertisement.isActive).toBe(false);
    });
  });
});

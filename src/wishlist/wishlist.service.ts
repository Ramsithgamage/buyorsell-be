import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Advertisement } from '../advertisements/entities/advertisement.entity';
import { GetWishlistDto } from './dto/get-wishlist.dto';
import {
  PaginatedWishlistResponseDto,
  WishlistItemResponseDto,
} from './dto/wishlist-response.dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(Advertisement)
    private readonly adRepository: Repository<Advertisement>,
  ) {}

  /** Add an ad to the wishlist. Idempotent. */
  async add(userId: number, adId: number): Promise<{ advertisementId: number }> {
    const ad = await this.adRepository.findOne({ where: { id: adId } });
    if (!ad) {
      throw new NotFoundException(`Advertisement with ID ${adId} not found.`);
    }
    if (ad.userId === userId) {
      throw new BadRequestException(
        'You cannot add your own advertisement to your wishlist.',
      );
    }

    const existing = await this.wishlistRepository.findOne({
      where: { userId, advertisementId: adId },
    });
    if (!existing) {
      try {
        await this.wishlistRepository.save(
          this.wishlistRepository.create({ userId, advertisementId: adId }),
        );
      } catch (err) {
        // Concurrent duplicate insert: the unique index makes this a no-op.
        if ((err as { code?: string }).code !== 'ER_DUP_ENTRY') throw err;
      }
    }
    return { advertisementId: adId };
  }

  /** Remove an ad from the wishlist. Idempotent. */
  async remove(userId: number, adId: number): Promise<void> {
    await this.wishlistRepository.delete({ userId, advertisementId: adId });
  }

  /** Remove every item from the user's wishlist. */
  async clear(userId: number): Promise<void> {
    await this.wishlistRepository.delete({ userId });
  }

  /** IDs of all wishlisted ads, used to render filled hearts. */
  async findIds(userId: number): Promise<number[]> {
    const items = await this.wishlistRepository.find({
      where: { userId },
      select: { advertisementId: true },
    });
    return items.map((i) => i.advertisementId);
  }

  async findAll(
    userId: number,
    dto: GetWishlistDto,
  ): Promise<PaginatedWishlistResponseDto> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 12;

    const [items, totalItems] = await this.wishlistRepository.findAndCount({
      where: { userId },
      relations: { advertisement: { user: true, category: true } },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: plainToInstance(WishlistItemResponseDto, items, {
        excludeExtraneousValues: true,
      }),
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }
}

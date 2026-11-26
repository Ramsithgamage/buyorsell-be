import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Advertisement } from '../advertisements/entities/advertisement.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WishlistItem, Advertisement])],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}

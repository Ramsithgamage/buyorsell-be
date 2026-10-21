import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { PromotionalAd } from './entities/promotional-ad.entity';
import { PromotionalAdsService } from './promotional-ads.service';
import { PromotionalAdsController } from './promotional-ads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PromotionalAd]), CacheModule.register()],
  controllers: [PromotionalAdsController],
  providers: [PromotionalAdsService],
  exports: [PromotionalAdsService],
})
export class PromotionalAdsModule {}

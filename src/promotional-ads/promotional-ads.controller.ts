import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Inject,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../common/enums/user-role.enum';
import { PromotionalAdsService } from './promotional-ads.service';
import { CreatePromoAdDto } from './dto/create-promo-ad.dto';
import { UpdatePromoAdDto } from './dto/update-promo-ad.dto';
import { PromoAdResponseDto } from './dto/promo-ad-response.dto';

@ApiTags('Promotional Advertisements')
@Controller('promotional-ads')
@UseInterceptors(ClassSerializerInterceptor)
export class PromotionalAdsController {
  private readonly CACHE_KEY_ACTIVE = 'promo_ads_active';

  constructor(
    private readonly promoService: PromotionalAdsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private async evictCache(): Promise<void> {
    await this.cacheManager.del(this.CACHE_KEY_ACTIVE);
    if (typeof this.cacheManager.clear === 'function') {
      await this.cacheManager.clear();
    }
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get all currently active and unexpired promotional ads (Public)',
  })
  @ApiResponse({ status: 200, type: [PromoAdResponseDto] })
  async findActive(): Promise<PromoAdResponseDto[]> {
    const cached = await this.cacheManager.get<PromoAdResponseDto[]>(
      this.CACHE_KEY_ACTIVE,
    );
    if (cached) {
      return cached;
    }

    const activePromos = await this.promoService.findAllActive();
    const serialized = plainToInstance(PromoAdResponseDto, activePromos);
    await this.cacheManager.set(this.CACHE_KEY_ACTIVE, serialized);
    return serialized;
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all promotional ads for admin dashboard (ADMIN only)',
  })
  @ApiResponse({ status: 200, type: [PromoAdResponseDto] })
  async findAll(): Promise<PromoAdResponseDto[]> {
    const allPromos = await this.promoService.findAll();
    return plainToInstance(PromoAdResponseDto, allPromos);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Get a specific promotional ad (ADMIN only)' })
  @ApiResponse({ status: 200, type: PromoAdResponseDto })
  @ApiResponse({
    status: 404,
    description: 'Promotional advertisement not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PromoAdResponseDto> {
    const promo = await this.promoService.findOne(id);
    return plainToInstance(PromoAdResponseDto, promo);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Create a promotional advertisement with banner image (ADMIN only)',
  })
  @ApiResponse({ status: 201, type: PromoAdResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or missing banner image',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  async create(
    @Body() createDto: CreatePromoAdDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<PromoAdResponseDto> {
    const promo = await this.promoService.create(createDto, user.sub!, file);
    await this.evictCache();
    return plainToInstance(PromoAdResponseDto, promo);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Update a promotional advertisement (ADMIN only)' })
  @ApiResponse({ status: 200, type: PromoAdResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  @ApiResponse({
    status: 404,
    description: 'Promotional advertisement not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePromoAdDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<PromoAdResponseDto> {
    const promo = await this.promoService.update(id, updateDto, file);
    await this.evictCache();
    return plainToInstance(PromoAdResponseDto, promo);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Delete a promotional advertisement (ADMIN only)' })
  @ApiResponse({ status: 204, description: 'No content' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN role required' })
  @ApiResponse({
    status: 404,
    description: 'Promotional advertisement not found',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.promoService.remove(id);
    await this.evictCache();
  }
}

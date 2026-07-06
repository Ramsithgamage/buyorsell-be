import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Inject,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { AdResponseDto } from './dto/ad-response.dto';

@ApiTags('Advertisements')
@Controller('advertisements')
@UseInterceptors(ClassSerializerInterceptor)
export class AdvertisementsController {
  private readonly CACHE_PREFIX = 'advertisements_list';

  constructor(
    private readonly adsService: AdvertisementsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private getCacheKey(categoryId?: number): string {
    return categoryId ? `${this.CACHE_PREFIX}_cat_${categoryId}` : `${this.CACHE_PREFIX}_all`;
  }

  private async evictCache(): Promise<void> {
    await this.cacheManager.del(`${this.CACHE_PREFIX}_all`);
    if (typeof this.cacheManager.clear === 'function') {
      await this.cacheManager.clear();
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all active advertisements' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiResponse({ status: 200, type: [AdResponseDto] })
  async findAll(@Query('categoryId') categoryId?: number): Promise<AdResponseDto[]> {
    const cacheKey = this.getCacheKey(categoryId);
    const cached = await this.cacheManager.get<AdResponseDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const ads = await this.adsService.findAll(categoryId);
    const result = plainToInstance(AdResponseDto, ads);

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Get a specific advertisement' })
  @ApiResponse({ status: 200, type: AdResponseDto })
  @ApiResponse({ status: 404, description: 'Advertisement not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AdResponseDto> {
    const ad = await this.adsService.findOne(id);
    return plainToInstance(AdResponseDto, ad);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create advertisement' })
  @ApiResponse({ status: 201, type: AdResponseDto })
  async create(
    @Body() createDto: CreateAdDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AdResponseDto> {
    const ad = await this.adsService.create(createDto, user.sub!);
    await this.evictCache();
    return plainToInstance(AdResponseDto, ad);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Update advertisement' })
  @ApiResponse({ status: 200, type: AdResponseDto })
  @ApiResponse({ status: 403, description: 'Owner validation failed' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAdDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AdResponseDto> {
    const ad = await this.adsService.update(id, updateDto, user.sub!);
    await this.evictCache();
    return plainToInstance(AdResponseDto, ad);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Delete advertisement' })
  @ApiResponse({ status: 204, description: 'No content' })
  @ApiResponse({ status: 403, description: 'Owner validation failed' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.adsService.remove(id, user.sub!);
    await this.evictCache();
  }
}

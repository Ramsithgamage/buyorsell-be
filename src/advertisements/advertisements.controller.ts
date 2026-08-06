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
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { AdResponseDto } from './dto/ad-response.dto';
import { GetAdvertisementsDto } from './dto/get-advertisements.dto';
import { PaginatedAdResponseDto } from './dto/paginated-ad-response.dto';

@ApiTags('Advertisements')
@Controller('advertisements')
@UseInterceptors(ClassSerializerInterceptor)
export class AdvertisementsController {
  private readonly CACHE_PREFIX = 'advertisements_list';

  constructor(
    private readonly adsService: AdvertisementsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  private getCacheKey(query: GetAdvertisementsDto): string {
    const catPart = query.categoryId ? `_cat_${query.categoryId}` : '';
    return `${this.CACHE_PREFIX}${catPart}_p_${query.page ?? 1}_l_${query.limit ?? 10}`;
  }

  private async evictCache(): Promise<void> {
    await this.cacheManager.del(`${this.CACHE_PREFIX}_all`);
    if (typeof this.cacheManager.clear === 'function') {
      await this.cacheManager.clear();
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all active advertisements with offset pagination' })
  @ApiResponse({ status: 200, type: PaginatedAdResponseDto })
  async findAll(@Query() query: GetAdvertisementsDto): Promise<PaginatedAdResponseDto> {
    const cacheKey = this.getCacheKey(query);
    const cached = await this.cacheManager.get<PaginatedAdResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, total } = await this.adsService.findAll(query);
    const limit = query.limit ?? 10;
    const totalPages = Math.ceil(total / limit);

    const paginatedResponse: PaginatedAdResponseDto = {
      data: plainToInstance(AdResponseDto, data),
      meta: {
        totalItems: total,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: query.page ?? 1,
      },
    };

    await this.cacheManager.set(cacheKey, paginatedResponse);
    return paginatedResponse;
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
  @UseInterceptors(FilesInterceptor('images', 5))
  @ApiOperation({ summary: 'Create advertisement' })
  @ApiResponse({ status: 201, type: AdResponseDto })
  async create(
    @Body() createDto: CreateAdDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<AdResponseDto> {
    const ad = await this.adsService.create(createDto, user.sub!, files);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', type: Number })
  @ApiOperation({ summary: 'Delete advertisement (Owner or ADMIN role required)' })
  @ApiResponse({ status: 204, description: 'No content' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.adsService.remove(id, user);
    await this.evictCache();
  }
}

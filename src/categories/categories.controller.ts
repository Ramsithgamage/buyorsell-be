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
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Categories')
@Controller('categories')
@UseInterceptors(ClassSerializerInterceptor)
export class CategoriesController {
  private readonly CACHE_KEY = 'categories_tree_active';

  constructor(
    private readonly categoriesService: CategoriesService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get the active hierarchical categories tree' })
  @ApiResponse({
    status: 200,
    description: 'Returns the tree structure of all active categories.',
    type: [CategoryResponseDto],
  })
  async getTrees(): Promise<CategoryResponseDto[]> {
    const cachedTree = await this.cacheManager.get<CategoryResponseDto[]>(this.CACHE_KEY);
    if (cachedTree) {
      return cachedTree;
    }

    const trees = await this.categoriesService.findTrees(true);
    const result = plainToInstance(CategoryResponseDto, trees);
    
    // Cache the resolved tree
    await this.cacheManager.set(this.CACHE_KEY, result);
    return result;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (requires authentication)' })
  @ApiResponse({
    status: 201,
    description: 'Category successfully created.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (validation error / loop detected).',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict (name or slug already exists).',
  })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.create(createCategoryDto);
    
    // Evict the categories tree cache
    await this.cacheManager.del(this.CACHE_KEY);
    
    return plainToInstance(CategoryResponseDto, category);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'Category ID', type: Number })
  @ApiOperation({ summary: 'Update an existing category (requires authentication)' })
  @ApiResponse({
    status: 200,
    description: 'Category successfully updated.',
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (validation error / loop detected).',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict (name or slug already exists).',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const updatedCategory = await this.categoriesService.update(id, updateCategoryDto);
    
    // Evict the categories tree cache
    await this.cacheManager.del(this.CACHE_KEY);
    
    return plainToInstance(CategoryResponseDto, updatedCategory);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Category ID', type: Number })
  @ApiOperation({ summary: 'Delete a category (requires authentication)' })
  @ApiResponse({
    status: 240, // standard 204
    description: 'Category successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found.',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoriesService.delete(id);
    
    // Evict the categories tree cache
    await this.cacheManager.del(this.CACHE_KEY);
  }
}

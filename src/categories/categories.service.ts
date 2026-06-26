import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import slugify from 'slugify';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Helper to resolve/generate a slug for a category name
   */
  private generateSlug(name: string): string {
    return slugify(name, { lower: true, strict: true });
  }

  /**
   * Creates a new category
   */
  async create(dto: CreateCategoryDto): Promise<Category> {
    // 1. Determine slug
    const slug = dto.slug || this.generateSlug(dto.name);

    // 2. Check name uniqueness
    const existingName = await this.categoryRepository.findOne({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new ConflictException('Category with this name already exists.');
    }

    // 3. Check slug uniqueness
    const existingSlug = await this.categoryRepository.findOne({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException('Category with this slug already exists.');
    }

    // 4. If parentId is provided, verify it exists
    if (dto.parentId !== undefined && dto.parentId !== null) {
      const parent = await this.categoryRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found.');
      }
    }

    // 5. Create and save entity
    const category = this.categoryRepository.create({
      name: dto.name,
      slug,
      isActive: dto.isActive ?? true,
      parentId: dto.parentId ?? null,
    });

    return this.categoryRepository.save(category);
  }

  /**
   * Updates an existing category
   */
  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    // 1. Verify existence
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    // 2. Check name uniqueness if name is changing
    if (dto.name && dto.name !== category.name) {
      const existingName = await this.categoryRepository.findOne({
        where: { name: dto.name, id: Not(id) },
      });
      if (existingName) {
        throw new ConflictException('Category with this name already exists.');
      }
    }

    // 3. Determine and check slug uniqueness if name or slug is changing
    if (dto.name || dto.slug) {
      const targetSlug = dto.slug || (dto.name ? this.generateSlug(dto.name) : category.slug);
      if (targetSlug !== category.slug) {
        const existingSlug = await this.categoryRepository.findOne({
          where: { slug: targetSlug, id: Not(id) },
        });
        if (existingSlug) {
          throw new ConflictException('Category with this slug already exists.');
        }
        category.slug = targetSlug;
      }
    }

    // Apply updates for simple fields
    if (dto.name !== undefined) category.name = dto.name;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    // 4. Handle parentId changes and run cycle validation
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent.');
      }

      if (dto.parentId !== null) {
        // Verify parent exists
        const parent = await this.categoryRepository.findOne({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new NotFoundException('Parent category not found.');
        }

        // Trace parent chain for cycles
        let currentParentId: number | null = dto.parentId;
        const visited = new Set<number>([id]);

        while (currentParentId !== null && currentParentId !== undefined) {
          if (visited.has(currentParentId)) {
            throw new BadRequestException(
              'A category cannot be a descendant of itself.',
            );
          }
          visited.add(currentParentId);

          const parentCat = await this.categoryRepository.findOne({
            where: { id: currentParentId },
          });
          if (!parentCat) {
            throw new NotFoundException('Parent category not found in the ancestor chain.');
          }
          currentParentId = parentCat.parentId;
        }

        category.parentId = dto.parentId;
      } else {
        category.parentId = null;
      }
    }

    return this.categoryRepository.save(category);
  }

  /**
   * Deletes a category
   */
  async delete(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    await this.categoryRepository.remove(category);
  }

  /**
   * Fetches all categories and constructs a hierarchical tree
   */
  async findTrees(onlyActive = false): Promise<Category[]> {
    const categories = await this.categoryRepository.find();
    return Category.buildTree(categories, onlyActive);
  }

  /**
   * Finds a category by its ID
   */
  async findById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found.');
    }
    return category;
  }
}

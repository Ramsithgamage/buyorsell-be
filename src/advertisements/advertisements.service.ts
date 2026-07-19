import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Advertisement } from './entities/advertisement.entity';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { CategoriesService } from '../categories/categories.service';
import { GetAdvertisementsDto } from './dto/get-advertisements.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { ApprovalStatus } from '../common/enums/approval-status.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class AdvertisementsService {
  constructor(
    @InjectRepository(Advertisement)
    private readonly adRepository: Repository<Advertisement>,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Helper to generate unique SEO slugs
   */
  private generateUniqueSlug(title: string): string {
    const slugged = slugify(title, { lower: true, strict: true });
    return `${slugged}-${Date.now()}`;
  }

  /**
   * Helper to isolate ownership checks (allows easy Admin Override injection in the future)
   */
  public verifyOwnership(ad: Advertisement, userId: number, isAdminOverride = false): void {
    if (isAdminOverride) return;
    if (ad.userId !== userId) {
      throw new ForbiddenException('You do not own this advertisement.');
    }
  }

  /**
   * Helper to handle and translate DB errors into proper NestJS HTTP Exceptions
   */
  private handleDbError(error: any): never {
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.message?.includes('foreign key constraint fails')) {
      throw new NotFoundException('Referenced Category or User does not exist.');
    }
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.message?.includes('cannot be deleted or updated')) {
      throw new ConflictException('Cannot perform operation due to foreign key references.');
    }
    throw error;
  }

  async create(dto: CreateAdDto, userId: number): Promise<Advertisement> {
    // Validate Category exists and is active
    const category = await this.categoriesService.findById(dto.categoryId);
    if (!category.isActive) {
      throw new BadRequestException('Advertisements cannot be placed under inactive categories.');
    }

    const slug = this.generateUniqueSlug(dto.title);
    const advertisement = this.adRepository.create({
      ...dto,
      slug,
      userId,
    });

    try {
      return await this.adRepository.save(advertisement);
    } catch (err) {
      this.handleDbError(err);
    }
  }

  async findAll(dto: GetAdvertisementsDto): Promise<{ data: Advertisement[]; total: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const query = this.adRepository.createQueryBuilder('ad')
      .where('ad.isActive = :isActive', { isActive: true })
      .orderBy('ad.createdAt', 'DESC');

    if (dto.categoryId) {
      query.andWhere('ad.categoryId = :categoryId', { categoryId: dto.categoryId });
    }

    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(id: number): Promise<Advertisement> {
    const ad = await this.adRepository.findOne({ where: { id } });
    if (!ad) {
      throw new NotFoundException(`Advertisement with ID ${id} not found.`);
    }
    return ad;
  }

  async update(id: number, dto: UpdateAdDto, userId: number): Promise<Advertisement> {
    const ad = await this.findOne(id);
    this.verifyOwnership(ad, userId);

    if (dto.categoryId !== undefined && dto.categoryId !== null && dto.categoryId !== ad.categoryId) {
      const category = await this.categoriesService.findById(dto.categoryId);
      if (!category.isActive) {
        throw new BadRequestException('Advertisements cannot be placed under inactive categories.');
      }
      ad.categoryId = dto.categoryId;
    }

    if (dto.title) {
      ad.title = dto.title;
      ad.slug = this.generateUniqueSlug(dto.title);
    }

    if (dto.description !== undefined) ad.description = dto.description;
    if (dto.price !== undefined) ad.price = dto.price;
    if (dto.images !== undefined) ad.images = dto.images;
    if (dto.isActive !== undefined) ad.isActive = dto.isActive;

    try {
      return await this.adRepository.save(ad);
    } catch (err) {
      this.handleDbError(err);
    }
  }

  async remove(id: number, user: JwtPayload): Promise<void> {
    const ad = await this.findOne(id);
    
    const isOwner = ad.userId === user.sub;
    const isAdmin = user.role === UserRole.ADMIN && user.approvalStatus === ApprovalStatus.APPROVED;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this advertisement.');
    }
    
    await this.adRepository.remove(ad);
  }
}

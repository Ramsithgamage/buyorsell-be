import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import slugify from 'slugify';
import { Advertisement } from './entities/advertisement.entity';
import { AdvertisementArchive } from './entities/advertisement-archive.entity';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { CategoriesService } from '../categories/categories.service';
import { GetAdvertisementsDto } from './dto/get-advertisements.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { ApprovalStatus } from '../common/enums/approval-status.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class AdvertisementsService {
  private readonly logger = new Logger(AdvertisementsService.name);

  constructor(
    @InjectRepository(Advertisement)
    private readonly adRepository: Repository<Advertisement>,
    private readonly categoriesService: CategoriesService,
    private readonly dataSource: DataSource,
  ) { }

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

  async create(dto: CreateAdDto, userId: number, files?: Express.Multer.File[]): Promise<Advertisement> {
    // Validate Category exists and is active
    const category = await this.categoriesService.findById(dto.categoryId);
    if (!category.isActive) {
      throw new BadRequestException('Advertisements cannot be placed under inactive categories.');
    }

    let imageUrls: string[] = dto.images || [];

    if (files && files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const file of files) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.jpg';
        const filename = `${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadDir, filename);

        await fs.promises.writeFile(filePath, file.buffer);
        imageUrls.push(`http://localhost:3000/uploads/${filename}`);
      }
    }

    const slug = this.generateUniqueSlug(dto.title);
    const advertisement = this.adRepository.create({
      ...dto,
      images: imageUrls,
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
      .leftJoinAndSelect('ad.user', 'user')
      .where('ad.isActive = :isActive', { isActive: true })
      .orderBy('ad.createdAt', 'DESC');

    if (dto.categoryId) {
      query.andWhere('ad.categoryId = :categoryId', { categoryId: dto.categoryId });
    }

    if (dto.q) {
      query.andWhere('ad.title LIKE :q', { q: `%${dto.q}%` });
    }

    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findOne(id: number): Promise<Advertisement> {
    const ad = await this.adRepository.findOne({
      where: { id },
      relations: { user: true }
    });
    if (!ad) {
      throw new NotFoundException(`Advertisement with ID ${id} not found.`);
    }
    return ad;
  }

  async update(id: number, dto: UpdateAdDto, userId: number, files?: Express.Multer.File[]): Promise<Advertisement> {
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
    if (dto.isActive !== undefined) ad.isActive = dto.isActive;

    let imageUrls: string[] = dto.images || ad.images || [];

    if (files && files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const file of files) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.jpg';
        const filename = `${uniqueSuffix}${ext}`;
        const filePath = path.join(uploadDir, filename);

        await fs.promises.writeFile(filePath, file.buffer);
        imageUrls.push(`http://localhost:3000/uploads/${filename}`);
      }
    }
    ad.images = imageUrls.slice(0, 5); // limit to max 5

    try {
      return await this.adRepository.save(ad);
    } catch (err) {
      this.handleDbError(err);
    }
  }

  async remove(id: number, user: JwtPayload): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const ad = await manager.findOne(Advertisement, { where: { id } });

      if (!ad) {
        throw new NotFoundException(`Advertisement with ID ${id} not found.`);
      }

      const isOwner = ad.userId === user.sub;
      const isAdmin = user.role === UserRole.ADMIN && user.approvalStatus === ApprovalStatus.APPROVED;

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You do not have permission to delete this advertisement.');
      }

      const archive = manager.create(AdvertisementArchive, {
        id: ad.id,
        title: ad.title,
        slug: ad.slug,
        description: ad.description,
        price: ad.price,
        userId: ad.userId,
        categoryId: ad.categoryId,
        images: ad.images,
        createdAt: ad.createdAt,
        updatedAt: ad.updatedAt,
        archivedBy: user.sub,
      });

      try {
        await manager.save(archive);
        await manager.remove(ad);
      } catch (error) {
        this.logger.error(`Failed to archive advertisement ID ${id}`, error);
        throw new InternalServerErrorException('An error occurred while archiving the advertisement.');
      }
    });
  }
}

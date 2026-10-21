import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromotionalAd } from './entities/promotional-ad.entity';
import { CreatePromoAdDto } from './dto/create-promo-ad.dto';
import { UpdatePromoAdDto } from './dto/update-promo-ad.dto';

@Injectable()
export class PromotionalAdsService {
  private readonly logger = new Logger(PromotionalAdsService.name);

  constructor(
    @InjectRepository(PromotionalAd)
    private readonly promoRepo: Repository<PromotionalAd>,
  ) {}

  private deleteImageFile(imageUrl: string): void {
    try {
      if (!imageUrl) return;
      const urlParts = imageUrl.split('/uploads/');
      if (urlParts.length > 1) {
        const rawFilename = urlParts[1].split('?')[0];
        const filename = path.basename(rawFilename);
        const filePath = path.join(
          process.cwd(),
          'public',
          'uploads',
          filename,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to delete promo image file: ${err}`);
    }
  }

  private async saveImageFile(file: Express.Multer.File): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `promo-${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, file.buffer);
    const baseUrl =
      process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    return `${baseUrl}/uploads/${filename}`;
  }

  async create(
    dto: CreatePromoAdDto,
    adminId: number,
    file?: Express.Multer.File,
  ): Promise<PromotionalAd> {
    if (!file) {
      throw new BadRequestException(
        'A promotional banner image file is required.',
      );
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end date format.');
    }

    if (end <= start) {
      throw new BadRequestException(
        'End date must be strictly after start date.',
      );
    }

    const imageUrl = await this.saveImageFile(file);

    const promo = this.promoRepo.create({
      image: imageUrl,
      linkUrl: dto.linkUrl,
      startDate: start,
      endDate: end,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      createdBy: adminId,
    });

    return await this.promoRepo.save(promo);
  }

  async findAllActive(): Promise<PromotionalAd[]> {
    const now = new Date();
    return await this.promoRepo
      .createQueryBuilder('promo')
      .where('promo.isActive = :isActive', { isActive: true })
      .andWhere('promo.startDate <= :now', { now })
      .andWhere('promo.endDate >= :now', { now })
      .orderBy('promo.createdAt', 'DESC')
      .getMany();
  }

  async findAll(): Promise<PromotionalAd[]> {
    return await this.promoRepo
      .createQueryBuilder('promo')
      .leftJoinAndSelect('promo.user', 'user')
      .orderBy('promo.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number): Promise<PromotionalAd> {
    const promo = await this.promoRepo.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!promo) {
      throw new NotFoundException(
        `Promotional advertisement with ID ${id} not found.`,
      );
    }

    return promo;
  }

  async update(
    id: number,
    dto: UpdatePromoAdDto,
    file?: Express.Multer.File,
  ): Promise<PromotionalAd> {
    const promo = await this.findOne(id);

    const start = dto.startDate ? new Date(dto.startDate) : promo.startDate;
    const end = dto.endDate ? new Date(dto.endDate) : promo.endDate;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end date format.');
    }

    if (end <= start) {
      throw new BadRequestException(
        'End date must be strictly after start date.',
      );
    }

    promo.startDate = start;
    promo.endDate = end;

    if (dto.linkUrl !== undefined) {
      promo.linkUrl = dto.linkUrl;
    }

    if (dto.isActive !== undefined) {
      promo.isActive = dto.isActive;
    }

    if (file) {
      const oldImage = promo.image;
      promo.image = await this.saveImageFile(file);
      this.deleteImageFile(oldImage);
    }

    return await this.promoRepo.save(promo);
  }

  async remove(id: number): Promise<void> {
    const promo = await this.findOne(id);
    this.deleteImageFile(promo.image);
    await this.promoRepo.remove(promo);
  }
}

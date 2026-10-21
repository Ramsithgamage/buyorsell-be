import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class PromoAdCreatorDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 'John' })
  @Expose()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @Expose()
  lastName!: string;

  @ApiProperty({ example: 'admin@example.com' })
  @Expose()
  email!: string;
}

export class PromoAdResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 'http://localhost:3000/uploads/promo-12345.jpg' })
  @Expose()
  image!: string;

  @ApiProperty({ example: 'https://example.com/promotions/summer-sale' })
  @Expose()
  linkUrl!: string;

  @ApiProperty({ example: '2026-10-14T00:00:00.000Z' })
  @Expose()
  startDate!: Date;

  @ApiProperty({ example: '2026-10-21T23:59:59.000Z' })
  @Expose()
  endDate!: Date;

  @ApiProperty({ example: true })
  @Expose()
  isActive!: boolean;

  @ApiProperty({ example: 1 })
  @Expose()
  createdBy!: number;

  @ApiProperty({ example: '2026-10-14T12:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-14T12:00:00.000Z' })
  @Expose()
  updatedAt!: Date;

  @ApiProperty({ type: PromoAdCreatorDto, required: false })
  @Expose()
  @Type(() => PromoAdCreatorDto)
  user?: PromoAdCreatorDto;
}

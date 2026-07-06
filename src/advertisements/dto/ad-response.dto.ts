import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AdResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @Expose()
  title!: string;

  @ApiProperty({ example: 'iphone-15-pro-max-1782382000000' })
  @Expose()
  slug!: string;

  @ApiProperty({ example: 'Like new iPhone with original box.' })
  @Expose()
  description!: string;

  @ApiProperty({ example: 999.99 })
  @Expose()
  price!: number;

  @ApiProperty({ example: 1 })
  @Expose()
  userId!: number;

  @ApiProperty({ example: 3 })
  @Expose()
  categoryId!: number;

  @ApiProperty({ example: ['https://example.com/image1.jpg'] })
  @Expose()
  images!: string[];

  @ApiProperty({ example: true })
  @Expose()
  isActive!: boolean;

  @ApiProperty({ example: '2026-07-01T12:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ example: '2026-07-01T12:00:00.000Z' })
  @Expose()
  updatedAt!: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class CategoryResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique ID of the category',
  })
  @Expose()
  id!: number;

  @ApiProperty({
    example: 'Electronics',
    description: 'The unique name of the category',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    example: 'electronics',
    description: 'URL-friendly SEO slug',
  })
  @Expose()
  slug!: string;

  @ApiProperty({
    example: true,
    description: 'Indicates whether the category is active',
  })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    example: null,
    description: 'ID of the parent category, if applicable',
    nullable: true,
  })
  @Expose()
  parentId!: number | null;

  @ApiProperty({
    type: () => [CategoryResponseDto],
    description: 'Array of child subcategories',
  })
  @Expose()
  @Type(() => CategoryResponseDto)
  children!: CategoryResponseDto[];

  @ApiProperty({
    example: '2026-06-25T12:00:00.000Z',
    description: 'The date and time when the category was created',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    example: '2026-06-25T12:00:00.000Z',
    description: 'The date and time when the category was last updated',
  })
  @Expose()
  updatedAt!: Date;
}

import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'The unique name of the category',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'electronics',
    description: 'URL-friendly SEO slug. If not provided, it will be auto-generated from the name.',
    required: false,
    minLength: 2,
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be in a valid URL-friendly format (lowercase letters, numbers, and hyphens only).',
  })
  slug?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates whether the category is active. Inactive categories and their descendants are hidden from the public tree.',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 1,
    description: 'ID of the parent category, if this is a subcategory. Set to null or omit for root categories.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  parentId?: number | null;
}

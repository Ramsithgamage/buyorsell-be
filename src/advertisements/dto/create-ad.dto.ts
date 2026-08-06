import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  Min,
  IsInt,
  IsArray,
  ArrayMaxSize,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max', description: 'Title of the advertisement' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Like new iPhone with original box.', description: 'Detailed description of the ad' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 999.99, description: 'Price of the item' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 3, description: 'The ID of the category under which the ad is placed' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId!: number;

  @ApiProperty({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    description: 'Array of image URLs (max 5)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  images?: string[];

  @ApiProperty({ example: true, description: 'Is the ad currently active', default: true, required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}

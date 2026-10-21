import {
  IsString,
  IsNotEmpty,
  IsUrl,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromoAdDto {
  @ApiProperty({
    example: 'https://example.com/promotions/summer-sale',
    description: 'Target destination URL for the Get Now button',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'linkUrl must be a valid URL address' })
  linkUrl!: string;

  @ApiProperty({
    example: '2026-10-14T00:00:00.000Z',
    description: 'Campaign start timestamp (ISO 8601 string)',
  })
  @IsDateString(
    {},
    { message: 'startDate must be a valid ISO 8601 date string' },
  )
  @IsNotEmpty()
  startDate!: string;

  @ApiProperty({
    example: '2026-10-21T23:59:59.000Z',
    description: 'Campaign end timestamp (ISO 8601 string)',
  })
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string' })
  @IsNotEmpty()
  endDate!: string;

  @ApiProperty({
    example: true,
    description: 'Is the promotion active',
    default: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }): boolean => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return Boolean(value);
  })
  @IsBoolean()
  isActive?: boolean;
}

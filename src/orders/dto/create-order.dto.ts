import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 12, description: 'ID of the advertisement being ordered' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adId!: number;

  @ApiProperty({ example: 2, description: 'Number of units (1–99)', minimum: 1, maximum: 99, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @ApiProperty({ example: '42 Main Street, Colombo 03', description: 'Shipping address' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 'Please leave at the door.', description: 'Optional message to the seller', required: false })
  @IsOptional()
  @IsString()
  message?: string;
}

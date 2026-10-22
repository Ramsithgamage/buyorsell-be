import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { OrderStatus } from '../../common/enums/order-status.enum';

// ── Nested DTOs ───────────────────────────────────────────────────────────────

export class OrderUserDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 'John' })
  @Expose()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @Expose()
  lastName!: string;
}

export class OrderAdDto {
  @ApiProperty({ example: 12 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @Expose()
  title!: string;

  @ApiProperty({ example: 'iphone-15-pro-max-1782382000000' })
  @Expose()
  slug!: string;
}

// ── Main response ─────────────────────────────────────────────────────────────

export class OrderResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 12 })
  @Expose()
  adId!: number;

  @ApiProperty({ example: 5 })
  @Expose()
  buyerId!: number;

  @ApiProperty({ example: 3 })
  @Expose()
  sellerId!: number;

  @ApiProperty({ example: 2 })
  @Expose()
  quantity!: number;

  @ApiProperty({ example: '42 Main Street, Colombo 03' })
  @Expose()
  address!: string;

  @ApiProperty({ example: 'Please leave at the door.', nullable: true })
  @Expose()
  message!: string | null;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  @Expose()
  status!: OrderStatus;

  @ApiProperty({ example: '2026-10-22T10:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-22T10:00:00.000Z' })
  @Expose()
  updatedAt!: Date;

  @ApiProperty({ type: OrderAdDto, required: false })
  @Expose()
  @Type(() => OrderAdDto)
  ad?: OrderAdDto;

  @ApiProperty({ type: OrderUserDto, required: false })
  @Expose()
  @Type(() => OrderUserDto)
  buyer?: OrderUserDto;

  @ApiProperty({ type: OrderUserDto, required: false })
  @Expose()
  @Type(() => OrderUserDto)
  seller?: OrderUserDto;
}

// ── Paginated wrapper ─────────────────────────────────────────────────────────

export class OrderPaginationMetaDto {
  @ApiProperty({ example: 100 })
  @Expose()
  totalItems!: number;

  @ApiProperty({ example: 10 })
  @Expose()
  itemCount!: number;

  @ApiProperty({ example: 10 })
  @Expose()
  itemsPerPage!: number;

  @ApiProperty({ example: 10 })
  @Expose()
  totalPages!: number;

  @ApiProperty({ example: 1 })
  @Expose()
  currentPage!: number;
}

export class PaginatedOrderResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  @Expose()
  @Type(() => OrderResponseDto)
  data!: OrderResponseDto[];

  @ApiProperty({ type: OrderPaginationMetaDto })
  @Expose()
  @Type(() => OrderPaginationMetaDto)
  meta!: OrderPaginationMetaDto;
}

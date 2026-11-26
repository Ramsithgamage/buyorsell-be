import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AdResponseDto } from '../../advertisements/dto/ad-response.dto';

export class WishlistItemResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id!: number;

  @ApiProperty({ example: 42 })
  @Expose()
  advertisementId!: number;

  @ApiProperty({ example: '2026-11-26T10:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    type: AdResponseDto,
    description: 'Check ad.isActive to show an "unavailable" state',
  })
  @Expose()
  @Type(() => AdResponseDto)
  advertisement!: AdResponseDto;
}

export class WishlistPaginationMetaDto {
  @ApiProperty() totalItems!: number;
  @ApiProperty() itemCount!: number;
  @ApiProperty() itemsPerPage!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() currentPage!: number;
}

export class PaginatedWishlistResponseDto {
  @ApiProperty({ type: [WishlistItemResponseDto] })
  data!: WishlistItemResponseDto[];

  @ApiProperty({ type: WishlistPaginationMetaDto })
  meta!: WishlistPaginationMetaDto;
}

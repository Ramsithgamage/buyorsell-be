import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { AdResponseDto } from './ad-response.dto';

export class PaginationMetaDto {
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

export class PaginatedAdResponseDto {
  @ApiProperty({ type: [AdResponseDto] })
  @Expose()
  @Type(() => AdResponseDto)
  data!: AdResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}

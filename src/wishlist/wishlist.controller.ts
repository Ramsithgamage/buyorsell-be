import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { WishlistService } from './wishlist.service';
import { GetWishlistDto } from './dto/get-wishlist.dto';
import { PaginatedWishlistResponseDto } from './dto/wishlist-response.dto';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get my wishlist (paginated, newest first)' })
  @ApiResponse({ status: 200, type: PaginatedWishlistResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() dto: GetWishlistDto,
  ): Promise<PaginatedWishlistResponseDto> {
    return this.wishlistService.findAll(user.sub!, dto);
  }

  @Get('ids')
  @ApiOperation({ summary: 'Get IDs of all wishlisted advertisements' })
  @ApiResponse({ status: 200, type: [Number] })
  findIds(@CurrentUser() user: JwtPayload): Promise<number[]> {
    return this.wishlistService.findIds(user.sub!);
  }

  @Post(':adId')
  @ApiOperation({ summary: 'Add an advertisement to the wishlist (idempotent)' })
  @ApiParam({ name: 'adId', type: Number })
  @ApiResponse({ status: 201, description: 'Added' })
  @ApiResponse({ status: 400, description: 'Own advertisement' })
  @ApiResponse({ status: 404, description: 'Advertisement not found' })
  add(
    @Param('adId', ParseIntPipe) adId: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.wishlistService.add(user.sub!, adId);
  }

  @Delete(':adId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an advertisement from the wishlist' })
  @ApiParam({ name: 'adId', type: Number })
  @ApiResponse({ status: 204, description: 'Removed' })
  async remove(
    @Param('adId', ParseIntPipe) adId: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.wishlistService.remove(user.sub!, adId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear my entire wishlist' })
  @ApiResponse({ status: 204, description: 'Cleared' })
  async clear(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.wishlistService.clear(user.sub!);
  }
}

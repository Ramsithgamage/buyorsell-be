import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import {
  OrderResponseDto,
  PaginatedOrderResponseDto,
} from './dto/order-response.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── POST /orders ──────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Place an order on an advertisement' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Ad inactive or self-order attempt' })
  @ApiResponse({ status: 404, description: 'Advertisement not found' })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(dto, user.sub!);
  }

  // ── GET /orders/received ──────────────────────────────────────────────────

  @Get('received')
  @ApiOperation({
    summary: "Get orders received on the seller's ads (seller view)",
  })
  @ApiResponse({ status: 200, type: PaginatedOrderResponseDto })
  async findReceived(
    @Query() dto: GetOrdersDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedOrderResponseDto> {
    return this.ordersService.findReceivedOrders(user.sub!, dto);
  }

  // ── GET /orders/placed ────────────────────────────────────────────────────

  @Get('placed')
  @ApiOperation({ summary: "Get orders placed by the buyer (buyer view)" })
  @ApiResponse({ status: 200, type: PaginatedOrderResponseDto })
  async findPlaced(
    @Query() dto: GetOrdersDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<PaginatedOrderResponseDto> {
    return this.ordersService.findPlacedOrders(user.sub!, dto);
  }

  // ── PATCH /orders/:id/ship ────────────────────────────────────────────────

  @Patch(':id/ship')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a PENDING order as SHIPPED (seller only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Order is not in PENDING status' })
  @ApiResponse({ status: 403, description: 'Not the seller of this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async ship(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto> {
    return this.ordersService.ship(id, user.sub!);
  }

  // ── PATCH /orders/:id/cancel ──────────────────────────────────────────────

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a PENDING order (buyer only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Order is not in PENDING status' })
  @ApiResponse({ status: 403, description: 'Not the buyer of this order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto> {
    return this.ordersService.cancel(id, user.sub!);
  }
}

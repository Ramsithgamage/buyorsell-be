import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { Advertisement } from '../advertisements/entities/advertisement.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { OrderStatus } from '../common/enums/order-status.enum';
import { PaginatedOrderResponseDto } from './dto/order-response.dto';
import { plainToInstance } from 'class-transformer';
import { OrderResponseDto } from './dto/order-response.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Advertisement)
    private readonly adRepository: Repository<Advertisement>,
  ) {}

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateOrderDto, buyerId: number): Promise<OrderResponseDto> {
    // Resolve the ad and derive sellerId
    const ad = await this.adRepository.findOne({
      where: { id: dto.adId },
      relations: { user: true },
    });

    if (!ad) {
      throw new NotFoundException(`Advertisement with ID ${dto.adId} not found.`);
    }
    if (!ad.isActive) {
      throw new BadRequestException('This advertisement is no longer active.');
    }
    if (ad.userId === buyerId) {
      throw new ForbiddenException('You cannot place an order on your own advertisement.');
    }

    const order = this.orderRepository.create({
      adId: dto.adId,
      buyerId,
      sellerId: ad.userId,
      quantity: dto.quantity,
      address: dto.address,
      message: dto.message ?? null,
      status: OrderStatus.PENDING,
    });

    const saved = await this.orderRepository.save(order);

    // Return with relations for the response DTO
    return plainToInstance(
      OrderResponseDto,
      await this.findOneOrFail(saved.id),
      { excludeExtraneousValues: true },
    );
  }

  // ── Find received (seller view) ───────────────────────────────────────────

  async findReceivedOrders(
    sellerId: number,
    dto: GetOrdersDto,
  ): Promise<PaginatedOrderResponseDto> {
    return this.paginate({ sellerId }, dto);
  }

  // ── Find placed (buyer view) ──────────────────────────────────────────────

  async findPlacedOrders(
    buyerId: number,
    dto: GetOrdersDto,
  ): Promise<PaginatedOrderResponseDto> {
    return this.paginate({ buyerId }, dto);
  }

  // ── Ship ──────────────────────────────────────────────────────────────────

  async ship(orderId: number, sellerId: number): Promise<OrderResponseDto> {
    const order = await this.findOneOrFail(orderId);

    if (order.sellerId !== sellerId) {
      throw new ForbiddenException('You do not own this order.');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Only PENDING orders can be shipped. Current status: ${order.status}.`,
      );
    }

    order.status = OrderStatus.SHIPPED;
    await this.orderRepository.save(order);

    return plainToInstance(
      OrderResponseDto,
      await this.findOneOrFail(orderId),
      { excludeExtraneousValues: true },
    );
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  async cancel(orderId: number, buyerId: number): Promise<OrderResponseDto> {
    const order = await this.findOneOrFail(orderId);

    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('You did not place this order.');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Only PENDING orders can be cancelled. Current status: ${order.status}.`,
      );
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    return plainToInstance(
      OrderResponseDto,
      await this.findOneOrFail(orderId),
      { excludeExtraneousValues: true },
    );
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async findOneOrFail(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { ad: true, buyer: true, seller: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found.`);
    }
    return order;
  }

  private async paginate(
    filter: { sellerId?: number; buyerId?: number },
    dto: GetOrdersDto,
  ): Promise<PaginatedOrderResponseDto> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;

    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.ad', 'ad')
      .leftJoinAndSelect('order.buyer', 'buyer')
      .leftJoinAndSelect('order.seller', 'seller')
      .orderBy('order.createdAt', 'DESC');

    if (filter.sellerId !== undefined) {
      query.where('order.seller_id = :sellerId', { sellerId: filter.sellerId });
    }
    if (filter.buyerId !== undefined) {
      query.where('order.buyer_id = :buyerId', { buyerId: filter.buyerId });
    }
    if (dto.status) {
      query.andWhere('order.status = :status', { status: dto.status });
    }

    query.skip(skip).take(limit);

    const [data, totalItems] = await query.getManyAndCount();

    return {
      data: plainToInstance(OrderResponseDto, data, {
        excludeExtraneousValues: true,
      }),
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }
}

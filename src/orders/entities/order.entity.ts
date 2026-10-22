import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { Advertisement } from '../../advertisements/entities/advertisement.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Entity('orders')
@Index('idx_orders_seller_status', ['sellerId', 'status'])
@Index('idx_orders_buyer_status', ['buyerId', 'status'])
@Index('idx_orders_ad', ['adId'])
export class Order {
  @Expose()
  @PrimaryGeneratedColumn()
  id!: number;

  // ── Foreign keys ────────────────────────────────────────────

  @Expose()
  @Column({ name: 'ad_id', type: 'int' })
  adId!: number;

  @Expose()
  @ManyToOne(() => Advertisement, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'ad_id' })
  ad!: Advertisement;

  @Expose()
  @Column({ name: 'buyer_id', type: 'int' })
  buyerId!: number;

  @Expose()
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Expose()
  @Column({ name: 'seller_id', type: 'int' })
  sellerId!: number;

  @Expose()
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;

  // ── Order data ───────────────────────────────────────────────

  @Expose()
  @Column({ type: 'tinyint', unsigned: true, default: 1 })
  quantity!: number;

  @Expose()
  @Column({ type: 'text' })
  address!: string;

  @Expose()
  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Expose()
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  // ── Timestamps ───────────────────────────────────────────────

  @Expose()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Expose()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

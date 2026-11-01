import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
import { NotificationType } from '../../common/enums/notification-type.enum';

@Entity('notifications')
@Index('idx_notifications_user_read_at', ['userId', 'readAt'])
export class Notification {
  @Expose()
  @PrimaryGeneratedColumn()
  id!: number;

  // ── Recipient ─────────────────────────────────────────────────

  @Expose()
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // ── Linked order (nullable — order may be deleted) ────────────

  @Expose()
  @Column({ name: 'order_id', type: 'int', nullable: true })
  orderId!: number | null;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order!: Order | null;

  // ── Payload ───────────────────────────────────────────────────

  @Expose()
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type!: NotificationType;

  @Expose()
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Expose()
  @Column({ type: 'text' })
  body!: string;

  // ── Read state ────────────────────────────────────────────────

  @Expose()
  @Column({ name: 'read_at', type: 'datetime', precision: 6, nullable: true })
  readAt!: Date | null;

  // ── Timestamp ─────────────────────────────────────────────────

  @Expose()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}


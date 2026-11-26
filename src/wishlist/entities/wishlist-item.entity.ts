import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Advertisement } from '../../advertisements/entities/advertisement.entity';
import { User } from '../../users/entities/user.entity';

@Entity('wishlist_items')
@Index('uq_wishlist_user_ad', ['userId', 'advertisementId'], { unique: true })
export class WishlistItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'advertisement_id', type: 'int' })
  advertisementId!: number;

  @ManyToOne(() => Advertisement, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'advertisement_id' })
  advertisement!: Advertisement;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

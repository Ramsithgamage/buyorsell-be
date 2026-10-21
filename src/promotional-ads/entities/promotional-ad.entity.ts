import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { User } from '../../users/entities/user.entity';

@Entity('promotional_advertisements')
@Index('IDX_promo_ads_active_dates', ['isActive', 'startDate', 'endDate'])
export class PromotionalAd {
  @Expose()
  @PrimaryGeneratedColumn()
  id!: number;

  @Expose()
  @Column({ length: 500 })
  image!: string;

  @Expose()
  @Column({ name: 'link_url', length: 500 })
  linkUrl!: string;

  @Expose()
  @Column({ name: 'start_date', type: 'datetime' })
  startDate!: Date;

  @Expose()
  @Column({ name: 'end_date', type: 'datetime' })
  endDate!: Date;

  @Expose()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Expose()
  @Column({ name: 'created_by', type: 'int' })
  createdBy!: number;

  @Expose()
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'created_by' })
  user!: User;

  @Expose()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Expose()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

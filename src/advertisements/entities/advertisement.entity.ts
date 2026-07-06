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
import { Category } from '../../categories/entities/category.entity';
import { User } from '../../users/entities/user.entity';

@Entity('advertisements')
export class Advertisement {
  @Expose()
  @PrimaryGeneratedColumn()
  id!: number;

  @Expose()
  @Column({ length: 255 })
  title!: string;

  @Expose()
  @Column({ unique: true, length: 300 })
  slug!: string;

  @Expose()
  @Column({ type: 'text' })
  description!: string;

  @Expose()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Expose()
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Expose()
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Expose()
  @Column({ name: 'category_id', type: 'int' })
  categoryId!: number;

  @Expose()
  @ManyToOne(() => Category, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @Expose()
  @Column({ name: 'images', type: 'json', nullable: true })
  images!: string[];

  @Expose()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Expose()
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Expose()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('advertisement_archives')
export class AdvertisementArchive {
  @PrimaryColumn()
  id!: number;

  @Column({ length: 255 })
  title!: string;

  @Column({ length: 300 })
  slug!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ name: 'category_id', type: 'int' })
  categoryId!: number;

  @Column({ name: 'images', type: 'json', nullable: true })
  images!: string[];

  @Column({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'updated_at' })
  updatedAt!: Date;

  @CreateDateColumn({ name: 'archived_at' })
  archivedAt!: Date;

  @Column({ name: 'archived_by', type: 'int' })
  archivedBy!: number;
}

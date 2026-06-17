import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('guest_sessions')
export class GuestSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({
    unique: true,
    name: 'guest_id',
    length: 36,
  })
  guestId!: string;

  @Column({
    name: 'expires_at',
  })
  @Index()
  expiresAt!: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}
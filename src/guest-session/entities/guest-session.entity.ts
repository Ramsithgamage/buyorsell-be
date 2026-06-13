import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('guest_sessions')
export class GuestSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    unique: true,
    name: 'guest_id',
  })
  guestId!: string;

  @Column({
    name: 'expires_at',
  })
  expiresAt!: Date;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('verification_tokens')
export class VerificationToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    unique: true,
    length: 64,
  })
  @Index()
  token!: string;

  @Column({
    name: 'expires_at',
  })
  @Index()
  expiresAt!: Date;

  @ManyToOne(
    () => User,
    {
      onDelete: 'CASCADE',
    },
  )
  user!: User;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;
}
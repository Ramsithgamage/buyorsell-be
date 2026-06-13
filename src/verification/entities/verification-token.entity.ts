import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('verification_tokens')
export class VerificationToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  token!: string;

  @Column({
    name: 'expires_at',
  })
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
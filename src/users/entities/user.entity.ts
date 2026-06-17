import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserStatus } from '../../common/enums/user-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'first_name',
    length: 50,
  })
  firstName!: string;

  @Column({
    name: 'last_name',
    length: 50,
  })
  lastName!: string;

  @Index({ unique: true })
  @Column({
    unique: true,
    length: 255,
  })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'tinyint',
    default: UserStatus.UNVERIFIED,
  })
  status!: UserStatus;

  @Column({
    name: 'refresh_token',
    nullable: true,
    length: 255,
  })
  refreshToken?: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt!: Date;
}
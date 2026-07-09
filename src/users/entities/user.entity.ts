import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApprovalStatus } from '../../common/enums/approval-status.enum';
import { VendorProfile } from './vendor-profile.entity';

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

  @Column({
    type: 'varchar',
    length: 20,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({
    type: 'varchar',
    length: 20,
    default: ApprovalStatus.APPROVED,
    name: 'approval_status',
  })
  approvalStatus!: ApprovalStatus;

  @OneToOne(() => VendorProfile, (vendorProfile) => vendorProfile.user, { cascade: true })
  vendorProfile?: VendorProfile;
}
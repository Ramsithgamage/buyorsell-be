import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('vendor_profiles')
export class VendorProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'company_name',
    length: 255,
  })
  companyName!: string;

  @Column({
    name: 'business_registration_number',
    length: 100,
  })
  businessRegistrationNumber!: string;

  @OneToOne(() => User, (user) => user.vendorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

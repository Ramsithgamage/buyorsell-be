import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique ID of the user',
  })
  id!: number;

  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
  })
  lastName!: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  email!: string;

  @ApiProperty({
    example: 'USER',
    description: 'Role of the user (USER, VENDOR, ADMIN)',
  })
  role!: string;

  @ApiProperty({
    example: 'APPROVED',
    description: 'Approval status of the user (PENDING, APPROVED, REJECTED)',
  })
  approvalStatus!: string;

  @ApiProperty({
    required: false,
    example: 'http://localhost:3000/uploads/avatars/abc.jpg',
    description: 'Profile picture URL, null if none set',
    nullable: true,
    type: String,
  })
  avatarUrl?: string | null;

  @ApiProperty({
    required: false,
    example: '2026-01-01T00:00:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt?: Date;

  @ApiProperty({
    required: false,
    description: 'Vendor business details (VENDOR role only)',
    type: () => VendorProfileResponseDto,
    nullable: true,
  })
  vendorProfile?: VendorProfileResponseDto | null;
}

export class VendorProfileResponseDto {
  @ApiProperty({ example: 'Acme Traders' })
  companyName!: string;

  @ApiProperty({ example: 'BRN-123456' })
  businessRegistrationNumber!: string;
}

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
}

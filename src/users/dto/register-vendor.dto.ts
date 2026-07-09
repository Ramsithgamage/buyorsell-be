import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class RegisterVendorDto extends CreateUserDto {
  @ApiProperty({
    example: 'ACME Corporation',
    description: 'The registered company name of the vendor',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  companyName!: string;

  @ApiProperty({
    example: 'BR-987654321',
    description: 'The business registration number of the vendor',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  businessRegistrationNumber!: string;
}

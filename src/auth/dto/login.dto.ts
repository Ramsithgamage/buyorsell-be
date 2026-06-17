import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'P@ssw0rd123!',
    description: 'Password of the user',
    minLength: 8,
    maxLength: 100,
  })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}
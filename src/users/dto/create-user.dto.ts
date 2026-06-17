import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../common/decorators/match.decorator';

export class CreateUserDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Unique email address of the user',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({
    example: 'P@ssw0rd123!',
    description: 'Strong password for the user account',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  }, {
    message: 'Password is too weak. Must contain uppercase, lowercase, number, and special character.',
  })
  password!: string;

  @ApiProperty({
    example: 'P@ssw0rd123!',
    description: 'Confirmation of the user password',
  })
  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Passwords do not match' })
  passwordConfirm!: string;
}
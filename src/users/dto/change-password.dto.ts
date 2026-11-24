import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'The current account password' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({
    example: 'N3w@Passw0rd!',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password is too weak. Must contain uppercase, lowercase, number, and special character.',
    },
  )
  newPassword!: string;

  @ApiProperty({ example: 'N3w@Passw0rd!' })
  @IsString()
  @IsNotEmpty()
  @Match('newPassword', { message: 'Passwords do not match' })
  newPasswordConfirm!: string;
}

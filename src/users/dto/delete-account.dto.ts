import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current password, required to confirm deletion',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    example: 'Registration successful. Verify your email.',
    description: 'Success message instructing user to verify email',
  })
  message!: string;
}

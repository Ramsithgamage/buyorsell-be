import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    example: false,
    description: 'Indicates the request failed',
  })
  success!: boolean;

  @ApiProperty({
    example: 'Error message details',
    description: 'The description of the error',
  })
  message!: string;

  @ApiProperty({
    example: 400,
    description: 'HTTP Status Code',
  })
  statusCode!: number;
}

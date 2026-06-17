import { BadRequestException } from '@nestjs/common';

export class TokenExpiredException extends BadRequestException {
  constructor(message: string = 'Verification token expired') {
    super(message);
  }
}

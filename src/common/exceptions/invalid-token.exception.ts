import { BadRequestException } from '@nestjs/common';

export class InvalidTokenException extends BadRequestException {
  constructor(message: string = 'Invalid token') {
    super(message);
  }
}

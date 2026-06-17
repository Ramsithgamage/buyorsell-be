import { BadRequestException } from '@nestjs/common';

export class DuplicateEmailException extends BadRequestException {
  constructor(message: string = 'Email already exists') {
    super(message);
  }
}

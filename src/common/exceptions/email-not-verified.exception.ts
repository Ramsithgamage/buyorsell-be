import { BadRequestException } from '@nestjs/common';

export class EmailNotVerifiedException extends BadRequestException {
  constructor(message: string = 'Email not verified') {
    super(message);
  }
}

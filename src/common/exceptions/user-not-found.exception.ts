import { BadRequestException } from '@nestjs/common';

export class UserNotFoundException extends BadRequestException {
  constructor(message: string = 'User not found') {
    super(message);
  }
}

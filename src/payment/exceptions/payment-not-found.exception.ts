import { NotFoundException } from '@nestjs/common';

export class PaymentNotFoundException extends NotFoundException {
  constructor(paymentId: string) {
    super(`Payment with ID ${paymentId} not found`);
  }
}

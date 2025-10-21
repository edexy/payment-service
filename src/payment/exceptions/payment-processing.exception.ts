import { BadRequestException } from '@nestjs/common';

export class PaymentProcessingException extends BadRequestException {
  constructor(
    message: string,
    public readonly paymentId: string,
  ) {
    super(`Payment processing failed: ${message}`);
  }
}

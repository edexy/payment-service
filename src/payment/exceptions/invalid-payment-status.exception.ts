import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '../enums/payment-status.enum';

export class InvalidPaymentStatusException extends BadRequestException {
  constructor(currentStatus: PaymentStatus, attemptedStatus: PaymentStatus) {
    super(
      `Cannot change payment status from ${currentStatus} to ${attemptedStatus}`,
    );
  }
}

import { PaymentStatus, PaymentMethod } from '../enums';
import { Payment } from '../interfaces/payment.interface';

export class PaymentEntity implements Payment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  failureReason?: string;

  constructor(partial: Partial<PaymentEntity>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt || new Date();
    this.updatedAt = partial.updatedAt || new Date();
  }

  updateStatus(status: PaymentStatus, failureReason?: string): void {
    this.status = status;
    this.updatedAt = new Date();

    if (status === PaymentStatus.COMPLETED || status === PaymentStatus.FAILED) {
      this.processedAt = new Date();
    }

    if (failureReason) {
      this.failureReason = failureReason;
    }
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  toJSON(): Payment {
    return {
      id: this.id,
      amount: this.amount,
      currency: this.currency,
      paymentMethod: this.paymentMethod,
      status: this.status,
      customerId: this.customerId,
      description: this.description,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      processedAt: this.processedAt,
      failureReason: this.failureReason,
    };
  }
}

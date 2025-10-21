import { PaymentStatus, PaymentMethod } from '../enums';

export interface Payment {
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
}

export interface PaymentCreateRequest {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  customerId: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentUpdateRequest {
  status?: PaymentStatus;
  metadata?: Record<string, any>;
  failureReason?: string;
}

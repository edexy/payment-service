import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentMethod } from '../enums';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Unique payment identifier',
    example: 'payment_123',
  })
  id: string;

  @ApiProperty({
    description: 'Payment amount in the smallest currency unit',
    example: 1000,
  })
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Customer identifier',
    example: 'customer_123',
  })
  customerId: string;

  @ApiPropertyOptional({
    description: 'Payment description',
    example: 'Payment for order #12345',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { orderId: 'order_123' },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Payment creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Payment last update timestamp',
    example: '2024-01-15T10:35:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Payment processing completion timestamp',
    example: '2024-01-15T10:35:00Z',
  })
  processedAt?: Date;

  @ApiPropertyOptional({
    description: 'Failure reason if payment failed',
    example: 'Insufficient funds',
  })
  failureReason?: string;
}

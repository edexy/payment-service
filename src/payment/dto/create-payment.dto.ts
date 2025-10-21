import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../enums/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Payment amount in the smallest currency unit (e.g., cents)',
    example: 1000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'USD',
    maxLength: 3,
  })
  @IsString()
  @MaxLength(3, { message: 'Currency code must be 3 characters or less' })
  currency: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Customer identifier',
    example: 'customer_123',
  })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({
    description: 'Payment description',
    example: 'Payment for order #12345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must be 500 characters or less' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { orderId: 'order_123', productId: 'product_456' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

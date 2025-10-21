import {
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../enums/payment-status.enum';

export class UpdatePaymentDto {
  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Invalid payment status' })
  status?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { transactionId: 'txn_123', processorResponse: 'approved' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Failure reason if payment failed',
    example: 'Insufficient funds',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Failure reason must be 1000 characters or less',
  })
  failureReason?: string;
}

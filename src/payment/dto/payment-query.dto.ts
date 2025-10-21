import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class PaymentQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter payments by customer ID',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter payments by status',
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Invalid payment status' })
  status?: PaymentStatus;
}

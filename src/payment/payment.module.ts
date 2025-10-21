import { Module } from '@nestjs/common';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';
import { PaymentRepository } from './repositories/payment.repository';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService, PaymentRepository],
})
export class PaymentModule {}

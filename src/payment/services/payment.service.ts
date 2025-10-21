import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentEntity } from '../entities/payment.entity';
import { CreatePaymentDto, UpdatePaymentDto } from '../dto';
import {
  PaginationDto,
  PaginatedResponseDto,
  PaginationMetaDto,
} from '../../common/dto';
import { PaymentStatus, PaymentMethod } from '../enums';
import {
  PaymentNotFoundException,
  InvalidPaymentStatusException,
} from '../exceptions';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly activeTimers = new Set<NodeJS.Timeout>();

  constructor(private readonly paymentRepository: PaymentRepository) {}

  async createPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentEntity> {
    this.logger.log(
      `Creating payment for customer: ${createPaymentDto.customerId}`,
    );

    const payment = new PaymentEntity({
      id: uuidv4(),
      amount: createPaymentDto.amount,
      currency: createPaymentDto.currency,
      paymentMethod: createPaymentDto.paymentMethod,
      status: PaymentStatus.PENDING,
      customerId: createPaymentDto.customerId,
      description: createPaymentDto.description,
      metadata: createPaymentDto.metadata,
    });

    const savedPayment = await this.paymentRepository.create(payment);

    // Simulate async payment processing
    this.processPaymentAsync(savedPayment.id);

    return savedPayment;
  }

  async getPaymentById(id: string): Promise<PaymentEntity> {
    this.logger.log(`Retrieving payment with ID: ${id}`);

    const payment = await this.paymentRepository.findById(id);
    if (!payment) {
      throw new PaymentNotFoundException(id);
    }

    return payment;
  }

  async getAllPaymentsPaginated(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<PaymentEntity>> {
    this.logger.log(
      `Retrieving paginated payments: page=${paginationDto.page}, limit=${paginationDto.limit}`,
    );

    const { data, total } = await this.paymentRepository.findPaginated(
      paginationDto.page,
      paginationDto.limit,
      paginationDto.sortBy,
      paginationDto.sortOrder,
    );

    const totalPages = Math.ceil(total / paginationDto.limit);
    const meta: PaginationMetaDto = {
      page: paginationDto.page,
      limit: paginationDto.limit,
      total,
      totalPages,
      hasNext: paginationDto.page < totalPages,
      hasPrevious: paginationDto.page > 1,
    };

    return { data, meta };
  }

  async getPaymentsByCustomerIdPaginated(
    customerId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<PaymentEntity>> {
    this.logger.log(
      `Retrieving paginated payments for customer: ${customerId}, page=${paginationDto.page}`,
    );

    const { data, total } =
      await this.paymentRepository.findByCustomerIdPaginated(
        customerId,
        paginationDto.page,
        paginationDto.limit,
        paginationDto.sortBy,
        paginationDto.sortOrder,
      );

    const totalPages = Math.ceil(total / paginationDto.limit);
    const meta: PaginationMetaDto = {
      page: paginationDto.page,
      limit: paginationDto.limit,
      total,
      totalPages,
      hasNext: paginationDto.page < totalPages,
      hasPrevious: paginationDto.page > 1,
    };

    return { data, meta };
  }

  async updatePayment(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentEntity> {
    this.logger.log(`Updating payment with ID: ${id}`);

    const payment = await this.getPaymentById(id);

    if (
      updatePaymentDto.status &&
      !this.isValidStatusTransition(payment.status, updatePaymentDto.status)
    ) {
      throw new InvalidPaymentStatusException(
        payment.status,
        updatePaymentDto.status,
      );
    }

    if (updatePaymentDto.status) {
      payment.updateStatus(
        updatePaymentDto.status,
        updatePaymentDto.failureReason,
      );
    }

    if (updatePaymentDto.metadata) {
      payment.updateMetadata(updatePaymentDto.metadata);
    }

    return this.paymentRepository.update(payment);
  }

  async getPaymentsByStatusPaginated(
    status: PaymentStatus,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponseDto<PaymentEntity>> {
    this.logger.log(
      `Retrieving paginated payments with status: ${status}, page=${paginationDto.page}`,
    );

    const { data, total } = await this.paymentRepository.findByStatusPaginated(
      status,
      paginationDto.page,
      paginationDto.limit,
      paginationDto.sortBy,
      paginationDto.sortOrder,
    );

    const totalPages = Math.ceil(total / paginationDto.limit);
    const meta: PaginationMetaDto = {
      page: paginationDto.page,
      limit: paginationDto.limit,
      total,
      totalPages,
      hasNext: paginationDto.page < totalPages,
      hasPrevious: paginationDto.page > 1,
    };

    return { data, meta };
  }

  private isValidStatusTransition(
    currentStatus: PaymentStatus,
    newStatus: PaymentStatus,
  ): boolean {
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]: [
        PaymentStatus.PROCESSING,
        PaymentStatus.CANCELLED,
      ],
      [PaymentStatus.PROCESSING]: [
        PaymentStatus.COMPLETED,
        PaymentStatus.FAILED,
      ],
      [PaymentStatus.COMPLETED]: [PaymentStatus.REFUNDED],
      [PaymentStatus.FAILED]: [PaymentStatus.PENDING], // Allow retry
      [PaymentStatus.CANCELLED]: [],
      [PaymentStatus.REFUNDED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private async processPaymentAsync(paymentId: string): Promise<void> {
    try {
      this.logger.log(`Starting async processing for payment: ${paymentId}`);

      // Simulate processing delay
      await this.delay(this.getRandomDelay());

      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        this.logger.error(`Payment not found during processing: ${paymentId}`);
        return;
      }

      //start transaction, in reality, this should be handled by db transaction for ease of rollback in case of failure

      // Update status to processing
      payment.updateStatus(PaymentStatus.PROCESSING);
      await this.paymentRepository.update(payment);

      // Simulate payment processing logic
      const processingResult = await this.simulatePaymentProcessing(payment);

      // Update payment based on processing result
      if (processingResult.success) {
        payment.updateStatus(PaymentStatus.COMPLETED);
        payment.updateMetadata({
          ...payment.metadata,
          transactionId: processingResult.transactionId,
          processorResponse: processingResult.response,
        });
      } else {
        payment.updateStatus(PaymentStatus.FAILED, processingResult.error);
      }

      await this.paymentRepository.update(payment);
      this.logger.log(
        `Payment processing completed for: ${paymentId}, Status: ${payment.status}`,
      );
      //commit transaction
    } catch (error) {
      this.logger.error(`Payment processing failed for: ${paymentId}`, error);
      //rollback transaction
      try {
        const payment = await this.paymentRepository.findById(paymentId);
        if (payment) {
          payment.updateStatus(
            PaymentStatus.FAILED,
            'Internal processing error',
          );
          await this.paymentRepository.update(payment);
        }
      } catch (updateError) {
        this.logger.error(
          `Failed to update payment status after processing error: ${paymentId}`,
          updateError,
        );
      }
    }
  }

  private async simulatePaymentProcessing(payment: PaymentEntity): Promise<{
    success: boolean;
    transactionId?: string;
    response?: string;
    error?: string;
  }> {
    // Simulate processing delay
    await this.delay(this.getRandomDelay());

    // Simulate different failure scenarios based on payment method and amount
    const failureRate = this.getFailureRate(payment);
    const shouldFail = Math.random() < failureRate;

    if (shouldFail) {
      const errorReasons = [
        'Insufficient funds',
        'Card declined',
        'Invalid card number',
        'Expired card',
        'Network timeout',
        'Fraud detection',
      ];

      return {
        success: false,
        error: errorReasons[Math.floor(Math.random() * errorReasons.length)],
      };
    }

    return {
      success: true,
      transactionId: `txn_${uuidv4().replace('-', '')}`,
      response: 'Payment approved',
    };
  }

  private getFailureRate(payment: PaymentEntity): number {
    let failureRate = 0.1;

    if (payment.amount > 10000) {
      failureRate += 0.1;
    }

    if (payment.paymentMethod === PaymentMethod.CREDIT_CARD) {
      failureRate += 0.05;
    }

    return Math.min(failureRate, 0.5);
  }

  private getRandomDelay(): number {
    // Random delay between 1-5 seconds
    return Math.random() * 4000 + 1000;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.activeTimers.delete(timer);
        resolve();
      }, ms);
      this.activeTimers.add(timer);
    });
  }

  /**
   * Clean up all active timers - useful for testing
   */
  cleanup(): void {
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
  }
}

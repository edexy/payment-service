import { Injectable, Logger } from '@nestjs/common';
import { PaymentEntity } from '../entities/payment.entity';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Injectable()
export class PaymentRepository {
  private readonly logger = new Logger(PaymentRepository.name);
  private readonly dataFilePath = path.join(
    process.cwd(),
    'data',
    'payments.json',
  );
  private readonly payments: Map<string, PaymentEntity> = new Map();

  constructor() {
    // Initialize storage asynchronously
    this.initializeStorage().catch((error) => {
      this.logger.error('Failed to initialize storage', error);
    });
  }

  private async initializeStorage(): Promise<void> {
    try {
      const dataDir = path.dirname(this.dataFilePath);
      await fs.mkdir(dataDir, { recursive: true });

      await this.loadFromFile();
      this.logger.log('Payment repository initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize payment repository', error);
    }
  }

  private async loadFromFile(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataFilePath, 'utf-8');
      const paymentsData = JSON.parse(data);

      for (const paymentData of paymentsData) {
        const payment = new PaymentEntity({
          ...paymentData,
          createdAt: new Date(paymentData.createdAt),
          updatedAt: new Date(paymentData.updatedAt),
          processedAt: paymentData.processedAt
            ? new Date(paymentData.processedAt)
            : undefined,
        });
        this.payments.set(payment.id, payment);
      }

      this.logger.log(`Loaded ${this.payments.size} payments from storage`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error('Failed to load payments from file', error);
      }
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      const paymentsArray = Array.from(this.payments.values()).map((payment) =>
        payment.toJSON(),
      );

      await fs.writeFile(
        this.dataFilePath,
        JSON.stringify(paymentsArray, null, 2),
        'utf-8',
      );
    } catch (error) {
      this.logger.error('Failed to save payments to file', error);
    }
  }

  async create(payment: PaymentEntity): Promise<PaymentEntity> {
    this.payments.set(payment.id, payment);
    await this.saveToFile();
    this.logger.log(`Created payment with ID: ${payment.id}`);
    return payment;
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    return this.payments.get(id) || null;
  }

  async findAll(): Promise<PaymentEntity[]> {
    return Array.from(this.payments.values());
  }

  async findPaginated(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ data: PaymentEntity[]; total: number }> {
    const allPayments = Array.from(this.payments.values());

    // Sort payments
    const sortedPayments = allPayments.sort((a, b) => {
      const aValue = this.getSortValue(a, sortBy);
      const bValue = this.getSortValue(b, sortBy);

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return this.paginateResults(sortedPayments, page, limit);
  }

  async findByCustomerId(customerId: string): Promise<PaymentEntity[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.customerId === customerId,
    );
  }

  async findByCustomerIdPaginated(
    customerId: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ data: PaymentEntity[]; total: number }> {
    const customerPayments = Array.from(this.payments.values()).filter(
      (payment) => payment.customerId === customerId,
    );

    // Sort payments
    const sortedPayments = customerPayments.sort((a, b) => {
      const aValue = this.getSortValue(a, sortBy);
      const bValue = this.getSortValue(b, sortBy);

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return this.paginateResults(sortedPayments, page, limit);
  }

  async update(payment: PaymentEntity): Promise<PaymentEntity> {
    this.payments.set(payment.id, payment);
    await this.saveToFile();
    this.logger.log(`Updated payment with ID: ${payment.id}`);
    return payment;
  }

  async findByStatus(status: string): Promise<PaymentEntity[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.status === status,
    );
  }

  async findByStatusPaginated(
    status: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{ data: PaymentEntity[]; total: number }> {
    const statusPayments = Array.from(this.payments.values()).filter(
      (payment) => payment.status === status,
    );

    // Sort payments
    const sortedPayments = statusPayments.sort((a, b) => {
      const aValue = this.getSortValue(a, sortBy);
      const bValue = this.getSortValue(b, sortBy);

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return this.paginateResults(sortedPayments, page, limit);
  }

  async count(): Promise<number> {
    return this.payments.size;
  }

  private paginateResults(
    payments: PaymentEntity[],
    page: number,
    limit: number,
  ): { data: PaymentEntity[]; total: number } {
    const total = payments.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = payments.slice(startIndex, endIndex);

    return { data, total };
  }

  private getSortValue(payment: PaymentEntity, sortBy: string): any {
    switch (sortBy) {
      case 'amount':
        return payment.amount;
      case 'status':
        return payment.status;
      case 'customerId':
        return payment.customerId;
      case 'paymentMethod':
        return payment.paymentMethod;
      case 'currency':
        return payment.currency;
      case 'createdAt':
        return payment.createdAt.getTime();
      case 'updatedAt':
        return payment.updatedAt.getTime();
      default:
        return payment.createdAt.getTime();
    }
  }
}

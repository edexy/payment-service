import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PaymentRepository } from '../repositories/payment.repository';
import { CreatePaymentDto } from '../dto';
import { PaymentStatus, PaymentMethod } from '../enums';
import { PaymentEntity } from '../entities/payment.entity';
import {
  PaymentNotFoundException,
  InvalidPaymentStatusException,
} from '../exceptions';
import { PaginationDto } from '../../common/dto';

// Enable fake timers globally for this test file
jest.useFakeTimers();

describe('PaymentService', () => {
  let service: PaymentService;

  const mockPaymentRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByCustomerId: jest.fn(),
    findPaginated: jest.fn(),
    findByCustomerIdPaginated: jest.fn(),
    findByStatusPaginated: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PaymentRepository,
          useValue: mockPaymentRepository,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.cleanup();
  });

  describe('createPayment', () => {
    it('should create a payment successfully', async () => {
      const createPaymentDto: CreatePaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_123',
        description: 'Test payment',
      };

      const mockPayment = new PaymentEntity({
        id: 'payment_123',
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPaymentRepository.create.mockResolvedValue(mockPayment);

      const result = await service.createPayment(createPaymentDto);

      expect(result).toBeDefined();
      expect(result.amount).toBe(createPaymentDto.amount);
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency,
          paymentMethod: createPaymentDto.paymentMethod,
          customerId: createPaymentDto.customerId,
        }),
      );
    });
  });

  describe('getPaymentById', () => {
    it('should return a payment when found', async () => {
      const paymentId = 'payment_123';
      const mockPayment = new PaymentEntity({
        id: paymentId,
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        customerId: 'customer_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPaymentRepository.findById.mockResolvedValue(mockPayment);

      const result = await service.getPaymentById(paymentId);

      expect(result).toBe(mockPayment);
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith(paymentId);
    });

    it('should throw PaymentNotFoundException when payment not found', async () => {
      const paymentId = 'non_existent_payment';
      mockPaymentRepository.findById.mockResolvedValue(null);

      await expect(service.getPaymentById(paymentId)).rejects.toThrow(
        PaymentNotFoundException,
      );
    });
  });

  describe('updatePayment', () => {
    it('should update payment status successfully', async () => {
      const paymentId = 'payment_123';
      const updateDto = { status: PaymentStatus.COMPLETED };

      const existingPayment = new PaymentEntity({
        id: paymentId,
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PROCESSING,
        customerId: 'customer_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatedPayment = new PaymentEntity({
        ...existingPayment,
        status: PaymentStatus.COMPLETED,
      });

      mockPaymentRepository.findById.mockResolvedValue(existingPayment);
      mockPaymentRepository.update.mockResolvedValue(updatedPayment);

      const result = await service.updatePayment(paymentId, updateDto);

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(mockPaymentRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PaymentStatus.COMPLETED,
        }),
      );
    });

    it('should throw InvalidPaymentStatusException for invalid status transition', async () => {
      const paymentId = 'payment_123';
      const updateDto = { status: PaymentStatus.COMPLETED };

      const existingPayment = new PaymentEntity({
        id: paymentId,
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        customerId: 'customer_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPaymentRepository.findById.mockResolvedValue(existingPayment);

      await expect(service.updatePayment(paymentId, updateDto)).rejects.toThrow(
        InvalidPaymentStatusException,
      );
    });
  });

  describe('getAllPaymentsPaginated', () => {
    it('should return paginated payments', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockPayments = [
        new PaymentEntity({
          id: 'payment_1',
          amount: 1000,
          currency: 'USD',
          paymentMethod: PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.PENDING,
          customerId: 'customer_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new PaymentEntity({
          id: 'payment_2',
          amount: 2000,
          currency: 'USD',
          paymentMethod: PaymentMethod.DEBIT_CARD,
          status: PaymentStatus.COMPLETED,
          customerId: 'customer_456',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const mockResult = {
        data: mockPayments,
        total: 2,
      };

      mockPaymentRepository.findPaginated.mockResolvedValue(mockResult);

      const result = await service.getAllPaymentsPaginated(paginationDto);

      expect(result.data).toEqual(mockPayments);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNext).toBe(false);
      expect(result.meta.hasPrevious).toBe(false);
      expect(mockPaymentRepository.findPaginated).toHaveBeenCalledWith(
        1,
        10,
        'createdAt',
        'desc',
      );
    });
  });

  describe('getPaymentsByCustomerIdPaginated', () => {
    it('should return paginated payments for specific customer', async () => {
      const customerId = 'customer_123';
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockPayments = [
        new PaymentEntity({
          id: 'payment_1',
          amount: 1000,
          currency: 'USD',
          paymentMethod: PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.PENDING,
          customerId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const mockResult = {
        data: mockPayments,
        total: 1,
      };

      mockPaymentRepository.findByCustomerIdPaginated.mockResolvedValue(
        mockResult,
      );

      const result = await service.getPaymentsByCustomerIdPaginated(
        customerId,
        paginationDto,
      );

      expect(result.data).toEqual(mockPayments);
      expect(result.meta.total).toBe(1);
      expect(
        mockPaymentRepository.findByCustomerIdPaginated,
      ).toHaveBeenCalledWith(customerId, 1, 10, 'createdAt', 'desc');
    });
  });

  describe('getPaymentsByStatusPaginated', () => {
    it('should return paginated payments by status', async () => {
      const status = PaymentStatus.PENDING;
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      const mockPayments = [
        new PaymentEntity({
          id: 'payment_1',
          amount: 1000,
          currency: 'USD',
          paymentMethod: PaymentMethod.CREDIT_CARD,
          status: PaymentStatus.PENDING,
          customerId: 'customer_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const mockResult = {
        data: mockPayments,
        total: 1,
      };

      mockPaymentRepository.findByStatusPaginated.mockResolvedValue(mockResult);

      const result = await service.getPaymentsByStatusPaginated(
        status,
        paginationDto,
      );

      expect(result.data).toEqual(mockPayments);
      expect(result.meta.total).toBe(1);
      expect(mockPaymentRepository.findByStatusPaginated).toHaveBeenCalledWith(
        status,
        1,
        10,
        'createdAt',
        'desc',
      );
    });
  });

  describe('cleanup', () => {
    it('should clean up active timers', () => {
      expect(() => service.cleanup()).not.toThrow();
    });
  });

  describe('async payment processing', () => {
    afterEach(() => {
      service.cleanup();
    });

    it('should create payment and initiate async processing', async () => {
      const createPaymentDto: CreatePaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_123',
        description: 'Test payment',
      };

      const mockPayment = new PaymentEntity({
        id: 'payment_123',
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPaymentRepository.create.mockResolvedValue(mockPayment);

      const result = await service.createPayment(createPaymentDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: createPaymentDto.amount,
          currency: createPaymentDto.currency,
          paymentMethod: createPaymentDto.paymentMethod,
          customerId: createPaymentDto.customerId,
        }),
      );
    });

    it('should process payment asynchronously and update status', async () => {
      const createPaymentDto: CreatePaymentDto = {
        amount: 500,
        currency: 'USD',
        paymentMethod: PaymentMethod.DEBIT_CARD,
        customerId: 'customer_456',
        description: 'Test async payment',
      };

      const mockPayment = new PaymentEntity({
        id: 'payment_456',
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const processingPayment = new PaymentEntity({
        ...mockPayment,
        status: PaymentStatus.PROCESSING,
      });

      const completedPayment = new PaymentEntity({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
        metadata: {
          transactionId: 'txn_test_456',
          processorResponse: 'Payment approved',
        },
      });

      const originalDelay = service['delay'];
      service['delay'] = jest.fn().mockResolvedValue(undefined);

      const originalGetRandomDelay = service['getRandomDelay'];
      service['getRandomDelay'] = jest.fn().mockReturnValue(0);

      const originalSimulatePaymentProcessing =
        service['simulatePaymentProcessing'];
      service['simulatePaymentProcessing'] = jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'txn_test_456',
        response: 'Payment approved',
      });

      mockPaymentRepository.create.mockResolvedValue(mockPayment);
      mockPaymentRepository.findById
        .mockResolvedValueOnce(mockPayment) // First call for processing
        .mockResolvedValueOnce(mockPayment); // Second call for completion
      mockPaymentRepository.update
        .mockResolvedValueOnce(processingPayment) // First update to PROCESSING
        .mockResolvedValueOnce(completedPayment); // Second update to COMPLETED

      const result = await service.createPayment(createPaymentDto);

      expect(result).toBeDefined();
      expect(result.status).toBe(PaymentStatus.PENDING);

      // Fast-forward all timers to complete async processing
      await jest.runAllTimersAsync();

      // Verify that the repository methods were called for async processing
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith(
        mockPayment.id,
      );
      expect(mockPaymentRepository.update).toHaveBeenCalledTimes(2);

      service['delay'] = originalDelay;
      service['getRandomDelay'] = originalGetRandomDelay;
      service['simulatePaymentProcessing'] = originalSimulatePaymentProcessing;
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto, UpdatePaymentDto } from '../dto';
import { PaymentStatus, PaymentMethod } from '../enums';
import { PaymentEntity } from '../entities/payment.entity';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: PaymentService;

  const mockPaymentService = {
    createPayment: jest.fn(),
    getPaymentById: jest.fn(),
    getAllPayments: jest.fn(),
    getAllPaymentsPaginated: jest.fn(),
    getPaymentsByCustomerId: jest.fn(),
    getPaymentsByCustomerIdPaginated: jest.fn(),
    updatePayment: jest.fn(),
    deletePayment: jest.fn(),
    getPaymentsByStatus: jest.fn(),
    getPaymentsByStatusPaginated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    // Clean up any active timers in the service
    if (paymentService && typeof paymentService.cleanup === 'function') {
      paymentService.cleanup();
    }
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('createPayment', () => {
    it('should create a payment', async () => {
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

      mockPaymentService.createPayment.mockResolvedValue(mockPayment);

      const result = await controller.createPayment(createPaymentDto);

      expect(result).toEqual(mockPayment.toJSON());
      expect(mockPaymentService.createPayment).toHaveBeenCalledWith(
        createPaymentDto,
      );
    });
  });

  describe('getPaymentById', () => {
    it('should return a payment by id', async () => {
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

      mockPaymentService.getPaymentById.mockResolvedValue(mockPayment);

      const result = await controller.getPaymentById(paymentId);

      expect(result).toEqual(mockPayment.toJSON());
      expect(mockPaymentService.getPaymentById).toHaveBeenCalledWith(paymentId);
    });
  });

  describe('getAllPayments', () => {
    it('should return all payments without filters', async () => {
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

      const mockPaginatedResponse = {
        data: mockPayments,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockPaymentService.getAllPaymentsPaginated.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.getAllPayments();

      expect(result.data).toEqual(mockPayments.map((p) => p.toJSON()));
      expect(result.meta).toEqual(mockPaginatedResponse.meta);
      expect(mockPaymentService.getAllPaymentsPaginated).toHaveBeenCalled();
    });

    it('should return payments filtered by customer id', async () => {
      const customerId = 'customer_123';
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

      const mockPaginatedResponse = {
        data: mockPayments,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockPaymentService.getPaymentsByCustomerIdPaginated.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.getAllPayments({ customerId });

      expect(result.data).toEqual(mockPayments.map((p) => p.toJSON()));
      expect(result.meta).toEqual(mockPaginatedResponse.meta);
      expect(
        mockPaymentService.getPaymentsByCustomerIdPaginated,
      ).toHaveBeenCalledWith(customerId, expect.any(Object));
    });

    it('should return payments filtered by status', async () => {
      const status = PaymentStatus.PENDING;
      const mockPayments = [
        new PaymentEntity({
          id: 'payment_1',
          amount: 1000,
          currency: 'USD',
          paymentMethod: PaymentMethod.CREDIT_CARD,
          status,
          customerId: 'customer_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      const mockPaginatedResponse = {
        data: mockPayments,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };

      mockPaymentService.getPaymentsByStatusPaginated.mockResolvedValue(
        mockPaginatedResponse,
      );

      const result = await controller.getAllPayments({ status });

      expect(result.data).toEqual(mockPayments.map((p) => p.toJSON()));
      expect(result.meta).toEqual(mockPaginatedResponse.meta);
      expect(
        mockPaymentService.getPaymentsByStatusPaginated,
      ).toHaveBeenCalledWith(status, expect.any(Object));
    });
  });

  describe('updatePayment', () => {
    it('should update a payment', async () => {
      const paymentId = 'payment_123';
      const updateDto: UpdatePaymentDto = {
        status: PaymentStatus.COMPLETED,
        metadata: { transactionId: 'txn_123' },
      };

      const mockPayment = new PaymentEntity({
        id: paymentId,
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.COMPLETED,
        customerId: 'customer_123',
        metadata: { transactionId: 'txn_123' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPaymentService.updatePayment.mockResolvedValue(mockPayment);

      const result = await controller.updatePayment(paymentId, updateDto);

      expect(result).toEqual(mockPayment.toJSON());
      expect(mockPaymentService.updatePayment).toHaveBeenCalledWith(
        paymentId,
        updateDto,
      );
    });
  });
});

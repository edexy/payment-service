import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PaymentStatus, PaymentMethod } from '../src/payment/enums';

const TEST_API_KEY = 'test-api-key-123';

describe('Payment API (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    process.env.API_KEYS = 'test-api-key-123';
    console.log('Test API Keys set:', process.env.API_KEYS);
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('POST /payments', () => {
    it('should return 401 for missing API key', () => {
      const createPaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_123',
        description: 'Test payment',
      };

      return request(app.getHttpServer())
        .post('/payments')
        .send(createPaymentDto)
        .expect(401);
    });

    it('should return 401 for invalid API key', () => {
      const createPaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_123',
        description: 'Test payment',
      };

      return request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', 'invalid-api-key')
        .send(createPaymentDto)
        .expect(401);
    });
    it('should create a payment successfully', () => {
      const createPaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_123',
        description: 'Test payment',
        metadata: { orderId: 'order_123' },
      };

      return request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .send(createPaymentDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.amount).toBe(createPaymentDto.amount);
          expect(res.body.currency).toBe(createPaymentDto.currency);
          expect(res.body.paymentMethod).toBe(createPaymentDto.paymentMethod);
          expect(res.body.customerId).toBe(createPaymentDto.customerId);
          expect(res.body.status).toBe(PaymentStatus.PENDING);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should return 400 for invalid payment data', () => {
      const invalidPaymentDto = {
        amount: -100,
        currency: 'INVALID',
        paymentMethod: 'invalid_method',
        customerId: '',
      };

      return request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .send(invalidPaymentDto)
        .expect(400);
    });

    it('should return 400 for missing required fields', () => {
      const incompletePaymentDto = {
        amount: 1000,
      };

      return request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .send(incompletePaymentDto)
        .expect(400);
    });
  });

  describe('GET /payments', () => {
    it('should return 401 for missing API key on GET request', () => {
      return request(app.getHttpServer()).get('/payments').expect(401);
    });

    it('should return 401 for invalid API key on GET request', () => {
      return request(app.getHttpServer())
        .get('/payments')
        .set('X-API-Key', 'invalid-api-key')
        .expect(401);
    });
    it('should return all payments', async () => {
      const createPaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_123',
      };

      await request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .send(createPaymentDto)
        .expect(201);

      return request(app.getHttpServer())
        .get('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter payments by customer ID', async () => {
      const customerId = 'customer_filter_test';
      const createPaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId,
      };

      await request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .send(createPaymentDto)
        .expect(201);

      return request(app.getHttpServer())
        .get(`/payments?customerId=${customerId}`)
        .set('X-API-Key', TEST_API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          res.body.data.forEach((payment: any) => {
            expect(payment.customerId).toBe(customerId);
          });
        });
    });

    it('should filter payments by status', async () => {
      // First create a payment with PENDING status
      const createPaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_status_test',
      };

      await request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .send(createPaymentDto)
        .expect(201);

      return request(app.getHttpServer())
        .get(`/payments?status=${PaymentStatus.PENDING}`)
        .set('X-API-Key', TEST_API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          res.body.data.forEach((payment: any) => {
            expect(payment.status).toBe(PaymentStatus.PENDING);
          });
        });
    });
  });

  describe('GET /payments/:id', () => {
    it('should return a payment by ID', async () => {
      // First create a payment
      const createPaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .send(createPaymentDto)
        .expect(201);

      const paymentId = createResponse.body.id;

      return request(app.getHttpServer())
        .get(`/payments/${paymentId}`)
        .set('X-API-Key', TEST_API_KEY)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(paymentId);
          expect(res.body.amount).toBe(createPaymentDto.amount);
        });
    });

    it('should return 404 for non-existent payment', () => {
      return request(app.getHttpServer())
        .get('/payments/non-existent-id')
        .set('X-API-Key', TEST_API_KEY)
        .expect(404);
    });
  });

  describe('PUT /payments/:id', () => {
    it('should update a payment successfully', async () => {
      const createPaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .send(createPaymentDto)
        .expect(201);

      const paymentId = createResponse.body.id;

      // First transition from PENDING to PROCESSING (valid transition)
      const processingUpdateDto = {
        status: PaymentStatus.PROCESSING,
        metadata: { transactionId: 'txn_123' },
      };

      await request(app.getHttpServer())
        .put(`/payments/${paymentId}`)
        .set('X-API-Key', TEST_API_KEY)
        .send(processingUpdateDto)
        .expect(200);

      // Then transition from PROCESSING to COMPLETED (valid transition)
      const completedUpdateDto = {
        status: PaymentStatus.COMPLETED,
        metadata: { transactionId: 'txn_123' },
      };

      return request(app.getHttpServer())
        .put(`/payments/${paymentId}`)
        .set('X-API-Key', TEST_API_KEY)
        .send(completedUpdateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(paymentId);
          expect(res.body.status).toBe(PaymentStatus.COMPLETED);
          expect(res.body.metadata.transactionId).toBe('txn_123');
        });
    });

    it('should return 404 for non-existent payment', () => {
      const updateDto = {
        status: PaymentStatus.COMPLETED,
      };

      return request(app.getHttpServer())
        .put('/payments/non-existent-id')
        .set('X-API-Key', TEST_API_KEY)
        .send(updateDto)
        .expect(404);
    });

    it('should return 400 for invalid status transition', async () => {
      const createPaymentDto = {
        amount: 1000,
        currency: 'USD',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        customerId: 'customer_123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/payments')
        .set('X-API-Key', TEST_API_KEY)
        .send(createPaymentDto)
        .expect(201);

      const paymentId = createResponse.body.id;

      const updateDto = {
        status: PaymentStatus.COMPLETED, // Invalid transition from PENDING
      };

      return request(app.getHttpServer())
        .put(`/payments/${paymentId}`)
        .set('X-API-Key', TEST_API_KEY)
        .send(updateDto)
        .expect(400);
    });
  });
});

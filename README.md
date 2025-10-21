# Payment Processing Microservice

A robust Node.js microservice built with NestJS that simulates payment processing with asynchronous operations, comprehensive error handling, API key authentication, and full API documentation.

## 🚀 Features

- **RESTful API** for payment operations (CRUD)
- **API Key Authentication** for secure access
- **Pagination Support** for efficient data retrieval
- **Asynchronous Payment Processing** with realistic simulation
- **Comprehensive Validation** using class-validator
- **Structured Logging** with Winston
- **Error Handling** with custom exceptions
- **API Documentation** with Swagger/OpenAPI
- **Data Persistence** with in-memory storage and JSON file backup
- **Unit & E2E Testing** with Jest
- **TypeScript** for type safety

## 📋 API Endpoints

### 🔐 Authentication Required

All payment endpoints require API key authentication.

### Payments

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `POST` | `/payments` | Create a new payment | ✅ Required |
| `GET` | `/payments` | Get all payments (with optional filtering) | ✅ Required |
| `GET` | `/payments/:id` | Get payment by ID | ✅ Required |
| `PUT` | `/payments/:id` | Update payment status/metadata | ✅ Required |

### Public Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| `GET` | `/` | Service information | ❌ Not required |
| `GET` | `/health` | Health check | ❌ Not required |
| `GET` | `/api/docs` | API documentation | ❌ Not required |

### API Documentation

Interactive API documentation is available at: `http://localhost:3000/api/docs`

## 🛠️ Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd payment-service
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Data Storage
DATA_DIR=./data

# API Authentication (Required)
# Comma-separated list of valid API keys
API_KEYS=your-secret-api-key-1,your-secret-api-key-2,dev-api-key-123
```

> **⚠️ Important**: The `API_KEYS` environment variable is required for the service to function. Without it, all payment endpoints will return 401 Unauthorized errors.

### 4. Run the Application

#### Development Mode

```bash
npm run start:dev
# or
yarn start:dev
```

#### Production Mode

```bash
npm run build
npm run start:prod
# or
yarn build
yarn start:prod
```

The service will be available at `http://localhost:3000`

## 🧪 Testing

### Run Unit Tests

```bash
npm run test
# or
yarn test
```

### Run E2E Tests

```bash
npm run test:e2e
# or
yarn test:e2e
```

### Run Tests with Coverage

```bash
npm run test:cov
# or
yarn test:cov
```

### Watch Mode

```bash
npm run test:watch
# or
yarn test:watch
```

## 📊 API Usage Examples

> **🔐 Authentication Required**: All payment endpoints require an API key. Use one of the methods below:
> - Header: `X-API-Key: your-secret-api-key-1`

### Create a Payment

```bash
curl -X POST http://localhost:3000/payments \
  -H "X-API-Key: your-secret-api-key-1" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "USD",
    "paymentMethod": "credit_card",
    "customerId": "customer_123",
    "description": "Payment for order #12345",
    "metadata": {
      "orderId": "order_123",
      "productId": "product_456"
    }
  }'
```

### Get All Payments

```bash
# Get paginated payments (default: page=1, limit=10)
curl -H "X-API-Key: your-secret-api-key-1" http://localhost:3000/payments

# With custom pagination
curl -H "X-API-Key: your-secret-api-key-1" "http://localhost:3000/payments?page=1&limit=20"
```

### Get Payment by ID

```bash
curl -H "X-API-Key: your-secret-api-key-1" http://localhost:3000/payments/{payment_id}
```

### Update Payment Status

```bash
curl -X PUT http://localhost:3000/payments/{payment_id} \
  -H "X-API-Key: your-secret-api-key-1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "metadata": {
      "transactionId": "txn_123",
      "processorResponse": "approved"
    }
  }'
```

### Filter Payments

```bash
# By customer ID (paginated)
curl -H "X-API-Key: your-secret-api-key-1" "http://localhost:3000/payments?customerId=customer_123"

# By status (paginated)
curl -H "X-API-Key: your-secret-api-key-1" "http://localhost:3000/payments?status=pending"

# By customer and status (paginated)
curl -H "X-API-Key: your-secret-api-key-1" "http://localhost:3000/payments?customerId=customer_123&status=completed"
```

### Pagination & Sorting

```bash
# Default pagination (page=1, limit=10)
curl -H "X-API-Key: your-secret-api-key-1" http://localhost:3000/payments

# Custom pagination
curl -H "X-API-Key: your-secret-api-key-1" "http://localhost:3000/payments?page=2&limit=20"

# With sorting
curl -H "X-API-Key: your-secret-api-key-1" "http://localhost:3000/payments?page=1&limit=10&sortBy=amount&sortOrder=desc"

```

### Public Endpoints (No Authentication Required)

```bash
# Health check
curl http://localhost:3000/health

# Service information
curl http://localhost:3000/

# API documentation
open http://localhost:3000/api/docs
```

## 🏗️ Architecture

### Project Structure

```
src/
├── common/
│   ├── filters/          # Global exception filters
│   ├── interceptors/     # Global interceptors
│   └── logger/           # Winston logging configuration
├── payment/
│   ├── controllers/      # Payment controllers
│   ├── dto/             # Data Transfer Objects
│   ├── entities/        # Payment entities
│   ├── enums/           # Payment enums
│   ├── exceptions/      # Custom exceptions
│   ├── interfaces/      # TypeScript interfaces
│   ├── repositories/    # Data access layer
│   └── services/        # Business logic
├── app.module.ts        # Main application module
└── main.ts             # Application entry point
```

### Key Components

- **PaymentEntity**: Core payment model with business logic
- **PaymentService**: Business logic and async processing simulation
- **PaymentRepository**: Data persistence with JSON file backup
- **PaymentController**: RESTful API endpoints
- **Custom Exceptions**: Domain-specific error handling
- **Validation**: Input validation with class-validator
- **Logging**: Structured logging with Winston

## 🔄 Payment Processing Flow

1. **Payment Creation**: Payment is created with `PENDING` status
2. **Async Processing**: Background processing simulates real payment gateway
3. **Status Updates**: Payment status changes based on processing result
4. **Error Handling**: Failed payments include failure reasons
5. **Persistence**: All changes are persisted to JSON file

### Payment Status Flow

```
PENDING → PROCESSING → COMPLETED
    ↓         ↓
CANCELLED   FAILED
    ↓
REFUNDED
```

## 🛡️ Error Handling

The service includes comprehensive error handling:

- **PaymentNotFoundException**: When payment ID doesn't exist
- **PaymentProcessingException**: When processing fails
- **InvalidPaymentStatusException**: When status transition is invalid
- **Validation Errors**: Input validation failures
- **Global Exception Filter**: Consistent error response format

## 📝 Logging

Structured logging with Winston:

- **Console Output**: Colored logs for development
- **File Logs**: Combined and error-specific log files
- **Log Rotation**: Automatic log file rotation
- **Request/Response Logging**: HTTP request interceptor

Log files are stored in the `logs/` directory:

- `combined.log`: All log levels
- `error.log`: Error logs only

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment | `development` | No |
| `LOG_LEVEL` | Logging level | `info` | No |
| `ALLOWED_ORIGINS` | CORS origins | `*` | No |
| `API_KEYS` | Comma-separated API keys | - | **Yes** |

### Payment Configuration

- **Failure Rate**: Configurable based on amount and payment method
- **Processing Delay**: Realistic async processing simulation
- **Status Transitions**: Enforced business rules

### Security Configuration

- **API Key Authentication**: Required for all payment endpoints
- **Multiple API Keys**: Support for different clients/environments
- **Public Endpoints**: Health checks and documentation remain accessible
- **Comprehensive Logging**: All authentication attempts logged


## 📄 License

This project is licensed under the MIT License.

## 📚 Additional Documentation

- **[Logging Guide](./LOGGING_GUIDE.md)**: Detailed logging implementation and usage

## 🆘 Support

For issues and questions:

1. Check the API documentation at `/api/docs`
2. Review the test files for usage examples
3. Check the logs for error details

### Quick Start Checklist

1. **Install Dependencies**: `yarn install`
2. **Set API Keys**: Add `API_KEYS=your-key-1,your-key-2` to `.env`
3. **Start Service**: `yarn start:dev`
4. **Test Authentication**: Use API key in requests
5. **Explore Documentation**: Visit http://localhost:3000/api/docs
# Logging Implementation Guide

## 🏗️ Logger Architecture

The payment service uses a hybrid logging approach combining NestJS's built-in Logger with Winston for enhanced functionality.

### 📊 Logger Components

1. **NestJS Built-in Logger**: Used throughout the application for standard logging
2. **Winston Logger Service**: Custom implementation for advanced logging features
3. **HTTP Logging Interceptor**: Automatic request/response logging
4. **Global Exception Filter**: Error logging with context

## 🔧 Logger Configuration

### Winston Logger Service (`src/common/logger/winston.config.ts`)

```typescript
export class WinstonLoggerService implements LoggerService {
  // Implements NestJS LoggerService interface
  // Provides structured logging with multiple transports
  // Supports console, file, and error-specific logging
}
```

### Features:
- **Console Output**: Colored logs for development
- **File Logging**: Combined and error-specific log files
- **Log Rotation**: Automatic file rotation (5MB max, 5 files)
- **Structured Format**: JSON format with timestamps and metadata
- **Context Support**: Service and request context tracking

## 📁 Log Files Structure

```
logs/
├── combined.log      # All log levels
└── error.log        # Error logs only
```

## 🚀 Usage Examples

### In Services
```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  async createPayment(dto: CreatePaymentDto) {
    this.logger.log(`Creating payment for customer: ${dto.customerId}`);
    // ... business logic
    this.logger.log(`Payment created successfully: ${payment.id}`);
  }
}
```

### In Controllers
```typescript
import { Controller, Logger } from '@nestjs/common';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  @Post()
  createPayment(@Body() dto: CreatePaymentDto) {
    this.logger.log('Payment creation request received');
    // ... controller logic
  }
}
```

### Custom Logger Service
```typescript
import { WinstonLoggerService } from './common/logger/winston.config';

@Injectable()
export class CustomService {
  constructor(
    @Inject('LoggerService') private readonly logger: WinstonLoggerService
  ) {}

  someMethod() {
    this.logger.log('Custom log message', 'CustomService');
    this.logger.error('Error occurred', 'Stack trace', 'CustomService');
  }
}
```

## 📊 Log Levels

| Level | Description | Usage |
|-------|-------------|-------|
| `error` | Error conditions | Exceptions, failures |
| `warn` | Warning conditions | Deprecations, issues |
| `log` | General information | Business logic flow |
| `debug` | Debug information | Development debugging |
| `verbose` | Verbose information | Detailed tracing |

## 🔧 Environment Configuration

### Environment Variables
```env
LOG_LEVEL=info          # Set logging level
NODE_ENV=development    # Environment context
```

### Log Levels by Environment
- **Development**: `debug` or `verbose`
- **Production**: `info` or `warn`
- **Testing**: `error` (minimal logging)

## 📈 Log Format

### Console Output (Development)
```
[PaymentService] Creating payment for customer: customer_123
[HTTP] Incoming Request: POST /payments
[HTTP] Outgoing Response: POST /payments - 201 - 45ms
```

### File Output (JSON)
```json
{
  "level": "info",
  "message": "Payment created successfully",
  "timestamp": "2024-01-15 10:30:00",
  "context": "PaymentService",
  "service": "payment-service"
}
```

## 🛡️ Error Logging

### Automatic Error Logging
- **Global Exception Filter**: Catches all unhandled exceptions
- **HTTP Interceptor**: Logs request/response errors
- **Service Errors**: Business logic error tracking

### Error Log Format
```json
{
  "level": "error",
  "message": "Payment processing failed",
  "timestamp": "2024-01-15 10:30:00",
  "context": "PaymentService",
  "trace": "Error stack trace...",
  "service": "payment-service"
}
```

## 🔍 Logging Best Practices

### 1. Use Appropriate Log Levels
```typescript
// ✅ Good
this.logger.log('Payment created successfully');
this.logger.error('Payment processing failed', error.stack);

// ❌ Avoid
this.logger.log('DEBUG: Variable value is...'); // Use debug level
this.logger.error('User clicked button'); // Use log level
```

### 2. Include Context
```typescript
// ✅ Good
this.logger.log(`Processing payment ${paymentId} for customer ${customerId}`);

// ❌ Avoid
this.logger.log('Processing payment');
```

### 3. Structured Logging
```typescript
// ✅ Good
this.logger.log('Payment status updated', {
  paymentId,
  oldStatus,
  newStatus,
  customerId
});

// ❌ Avoid
this.logger.log(`Payment ${paymentId} status changed from ${oldStatus} to ${newStatus}`);
```

### 4. Error Handling
```typescript
// ✅ Good
try {
  await this.processPayment(payment);
} catch (error) {
  this.logger.error('Payment processing failed', error.stack, 'PaymentService');
  throw new PaymentProcessingException('Processing failed', payment.id);
}
```

## 🔧 Customization

### Adding New Transports
```typescript
// Add database logging
new winston.transports.MongoDB({
  db: 'mongodb://localhost:27017/logs',
  collection: 'payment-logs'
})

// Add external service logging
new winston.transports.Http({
  host: 'logs.example.com',
  port: 443,
  path: '/api/logs'
})
```

### Custom Formatting
```typescript
winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint() // For development
)
```

## Integration with Monitoring

### Health Checks
```typescript
@Get('health')
getHealth() {
  this.logger.log('Health check requested');
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

## Summary

The logging implementation provides:
- ✅ **Structured Logging**: JSON format with metadata
- ✅ **Multiple Transports**: Console and file output
- ✅ **Log Rotation**: Automatic file management
- ✅ **Error Tracking**: Comprehensive error logging
- ✅ **Performance**: Non-blocking async operations
- ✅ **Flexibility**: Easy to extend and customize

This logging setup ensures comprehensive monitoring and debugging capabilities for the payment processing microservice.

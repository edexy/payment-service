import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
  PaymentQueryDto,
} from '../dto';
import { PaginatedResponseDto } from '../../common/dto';
import { PaymentEntity } from '../entities/payment.entity';

@ApiTags('Payments')
@ApiSecurity('api-key')
@Controller('payments')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new payment',
    description: 'Creates a new payment and initiates asynchronous processing',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing API key',
  })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.createPayment(createPaymentDto);
    return payment.toJSON();
  }

  @Get()
  @ApiOperation({
    summary: 'Get all payments',
    description:
      'Retrieves all payments with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Payments retrieved successfully',
    type: PaginatedResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing API key',
  })
  async getAllPayments(
    @Query() queryDto: PaymentQueryDto = new PaymentQueryDto(),
  ): Promise<PaginatedResponseDto<PaymentResponseDto>> {
    let result: PaginatedResponseDto<PaymentEntity>;

    if (queryDto.customerId) {
      result = await this.paymentService.getPaymentsByCustomerIdPaginated(
        queryDto.customerId,
        queryDto,
      );
    } else if (queryDto.status) {
      result = await this.paymentService.getPaymentsByStatusPaginated(
        queryDto.status,
        queryDto,
      );
    } else {
      result = await this.paymentService.getAllPaymentsPaginated(queryDto);
    }

    return {
      data: result.data.map((payment) => payment.toJSON()),
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieves a specific payment by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: 'payment_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async getPaymentById(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.getPaymentById(id);
    return payment.toJSON();
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update payment',
    description: 'Updates payment status and metadata',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: 'payment_123',
  })
  @ApiBody({ type: UpdatePaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Payment updated successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition or input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.updatePayment(
      id,
      updatePaymentDto,
    );
    return payment.toJSON();
  }
}

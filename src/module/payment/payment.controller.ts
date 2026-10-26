import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './payment.service.js';
import { InitiatePaymentDto } from './dto/initiate-payment.dto.js';
import { PaymentWebhookDto } from './dto/payment-webhook.dto.js';
import { RefundPaymentDto } from './dto/refund-payment.dto.js';

interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    role?: string;
  };
}

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('appointment/:appointmentId/initiate')
  @HttpCode(HttpStatus.OK)
  initiatePayment(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: InitiatePaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentService.initiatePayment(appointmentId, dto, req.user);
  }

  @Post('cash/:appointmentId')
  @HttpCode(HttpStatus.OK)
  createCashPayment(
    @Param('appointmentId') appointmentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentService.createCashPayment(appointmentId, req.user);
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Param('provider') provider: string,
    @Body() dto: PaymentWebhookDto,
    @Headers('x-payment-signature') signature: string | undefined,
  ) {
    return this.paymentService.handleWebhook(provider, dto, signature);
  }

  @Get(':paymentId')
  getPayment(
    @Param('paymentId') paymentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentService.getPayment(paymentId, req.user);
  }

  @Get('appointment/:appointmentId')
  getAppointmentPayment(
    @Param('appointmentId') appointmentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentService.getAppointmentPayment(appointmentId, req.user);
  }

  @Post(':paymentId/refund')
  @HttpCode(HttpStatus.OK)
  refundPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: RefundPaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentService.refundPayment(paymentId, dto, req.user);
  }
}

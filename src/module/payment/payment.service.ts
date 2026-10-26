import { Injectable, NotImplementedException } from '@nestjs/common';
import type { InitiatePaymentDto } from './dto/initiate-payment.dto.js';
import type { PaymentWebhookDto } from './dto/payment-webhook.dto.js';
import type { RefundPaymentDto } from './dto/refund-payment.dto.js';

interface PaymentUser {
  _id: string;
  role?: string;
}

@Injectable()
export class PaymentService {
  async initiatePayment(
    appointmentId: string,
    dto: InitiatePaymentDto,
    user: PaymentUser,
  ): Promise<never> {
    void appointmentId;
    void dto;
    void user;

    throw new NotImplementedException(
      'Electronic payment initiation is not implemented yet',
    );
  }

  async createCashPayment(
    appointmentId: string,
    user: PaymentUser,
  ): Promise<never> {
    void appointmentId;
    void user;

    throw new NotImplementedException(
      'Cash payment processing is not implemented yet',
    );
  }

  async handleWebhook(
    provider: string,
    dto: PaymentWebhookDto,
    signature: string | undefined,
  ): Promise<never> {
    void provider;
    void dto;
    void signature;

    throw new NotImplementedException(
      'Payment webhook processing is not implemented yet',
    );
  }

  async getPayment(paymentId: string, user: PaymentUser): Promise<never> {
    void paymentId;
    void user;

    throw new NotImplementedException(
      'Payment retrieval is not implemented yet',
    );
  }

  async getAppointmentPayment(
    appointmentId: string,
    user: PaymentUser,
  ): Promise<never> {
    void appointmentId;
    void user;

    throw new NotImplementedException(
      'Appointment payment retrieval is not implemented yet',
    );
  }

  async refundPayment(
    paymentId: string,
    dto: RefundPaymentDto,
    user: PaymentUser,
  ): Promise<never> {
    void paymentId;
    void dto;
    void user;

    throw new NotImplementedException(
      'Payment refund processing is not implemented yet',
    );
  }
}

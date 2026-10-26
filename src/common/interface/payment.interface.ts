import type { Types } from 'mongoose';
import type { PaymentMethod, PaymentStatus } from '../enum/order.enum.js';
import type { PaymentDocument } from '../../database/model/payment.model.js';

/** Amounts are stored as integers in minor units (e.g. piasters for EGP). */
export interface IPayment {
  appointment: Types.ObjectId;
  user: Types.ObjectId;
  hospital: Types.ObjectId;
  doctor: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  /** True while the payment is pending or paid; backs the one-active-payment-per-appointment unique index. */
  isActive: boolean;
  provider?: string | null;
  providerReference?: string | null;
  checkoutUrl?: string | null;
  paidAt?: Date | null;
  failedAt?: Date | null;
  failureReason?: string | null;
  refundedAt?: Date | null;
  refundReason?: string | null;
  refundReference?: string | null;
  confirmedBy?: Types.ObjectId | null;
  refundedBy?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPaymentResponse {
  message: string;
  payment: PaymentDocument;
}

export interface IPaymentListResponse {
  message: string;
  payments: PaymentDocument[];
}

export interface IPaymentWebhookResponse {
  received: true;
  processed: boolean;
}

export type PaymentWebhookEventType = 'payment.succeeded' | 'payment.failed';

export interface IPaymentWebhookEvent {
  eventId: string;
  providerReference: string;
  event: PaymentWebhookEventType;
  /** Amount in minor units. */
  amount: number;
  currency: string;
}

export interface ICheckoutInput {
  paymentId: string;
  amount: number;
  currency: string;
  description: string;
}

export interface ICheckoutSession {
  providerReference: string;
  checkoutUrl: string;
}

export interface IRefundInput {
  paymentId: string;
  providerReference: string;
  amount: number;
  currency: string;
  reason?: string;
}

export interface IRefundResult {
  refundReference: string;
}

export interface IPaymentProvider {
  readonly name: string;

  createCheckout(input: ICheckoutInput): Promise<ICheckoutSession>;

  verifyWebhookSignature(
    event: IPaymentWebhookEvent,
    signature: string | undefined,
  ): boolean;

  refund(input: IRefundInput): Promise<IRefundResult>;
}

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

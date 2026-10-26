import { IsIn, IsInt, IsString, Length, Min } from 'class-validator';
import type { PaymentWebhookEventType } from '../../../common/interface/payment.interface.js';

export class PaymentWebhookDto {
  @IsString()
  @Length(1, 100)
  eventId!: string;

  @IsString()
  @Length(1, 100)
  providerReference!: string;

  @IsIn(['payment.succeeded', 'payment.failed'])
  event!: PaymentWebhookEventType;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;
}

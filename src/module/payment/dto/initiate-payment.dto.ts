import { IsEnum } from 'class-validator';
import { PaymentMethod } from '../../../common/enum/order.enum.js';

export class InitiatePaymentDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}

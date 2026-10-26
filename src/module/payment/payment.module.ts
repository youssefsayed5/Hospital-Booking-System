import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentService } from './payment.service.js';
import { PaymentController } from './payment.controller.js';
import { Payment, PaymentModel } from '../../database/model/payment.model.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentModel }]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

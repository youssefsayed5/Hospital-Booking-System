import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import type { IPayment } from '../../common/interface/payment.interface.js';
import { PaymentMethod, PaymentStatus } from '../../common/enum/order.enum.js';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Payment implements IPayment {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Appointment',
    required: [true, 'Appointment is required'],
  })
  appointment!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  })
  user!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Hospital is required'],
  })
  hospital!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Doctor is required'],
  })
  doctor!: Types.ObjectId;

  @Prop({
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be positive'],
    validate: {
      validator: Number.isInteger,
      message: 'Amount must be an integer in minor units',
    },
  })
  amount!: number;

  @Prop({ type: String, required: true, uppercase: true, trim: true })
  currency!: string;

  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: [true, 'Payment method is required'],
  })
  method!: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: String, default: null })
  provider?: string | null;

  @Prop({ type: String, default: null })
  providerReference?: string | null;

  @Prop({ type: String, default: null })
  checkoutUrl?: string | null;

  @Prop({ type: Date, default: null })
  paidAt?: Date | null;

  @Prop({ type: Date, default: null })
  failedAt?: Date | null;

  @Prop({ type: String, default: null })
  failureReason?: string | null;

  @Prop({ type: Date, default: null })
  refundedAt?: Date | null;

  @Prop({ type: String, default: null })
  refundReason?: string | null;

  @Prop({ type: String, default: null })
  refundReference?: string | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
  confirmedBy?: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, default: null })
  refundedBy?: Types.ObjectId | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentDocument = HydratedDocument<Payment>;

export const PaymentModel = SchemaFactory.createForClass(Payment);

PaymentModel.index(
  { appointment: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
);
PaymentModel.index(
  { providerReference: 1 },
  {
    unique: true,
    partialFilterExpression: { providerReference: { $type: 'string' } },
  },
);
PaymentModel.index({ user: 1, createdAt: -1 });
PaymentModel.index({ hospital: 1, status: 1, createdAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import type { IAppointment } from '../../common/interface/appointment.interface.js';
import { AppointmentStatus } from '../../common/enum/Appointment.enum.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Appointment implements IAppointment {
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
    type: Date,
    required: [true, 'Appointment date is required'],
  })
  appointmentDate!: Date;

  @Prop({
    type: String,
    required: [true, 'Start time is required'],
    trim: true,
    match: [TIME_REGEX, 'Start time must be in HH:mm format'],
  })
  startTime!: string;

  @Prop({
    type: String,
    required: [true, 'End time is required'],
    trim: true,
    match: [TIME_REGEX, 'End time must be in HH:mm format'],
  })
  endTime!: string;

  @Prop({
    type: String,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.PENDING,
  })
  status!: AppointmentStatus;

  @Prop({ type: String, trim: true })
  reason?: string;

  @Prop({ type: String, trim: true })
  notes?: string;

  @Prop({ type: Date })
  cancelledAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type AppointmentDocument = HydratedDocument<Appointment>;

export const AppointmentModel = SchemaFactory.createForClass(Appointment);

AppointmentModel.index({ doctor: 1, appointmentDate: 1, status: 1 });
AppointmentModel.index({ user: 1, appointmentDate: 1 });
AppointmentModel.index({ hospital: 1, status: 1, appointmentDate: 1 });

import { Types } from 'mongoose';
import { AppointmentDocument } from '../../database/model/appointment.model.js';
import { AppointmentStatus } from '../enum/Appointment.enum.js';

export type RefLike = Types.ObjectId | { _id: Types.ObjectId };

export interface ITimeRange {
  startTime: string;
  endTime: string;
}

export interface IDayRange {
  dayStart: Date;
  dayEnd: Date;
}

export interface IConflictCheckParams extends ITimeRange {
  doctor: Types.ObjectId;
  date: Date;
  excludeId?: Types.ObjectId;
}

export interface IAppointmentResponse {
  message: string;
  appointment: AppointmentDocument;
}

export interface IAppointmentListResponse {
  message: string;
  appointments: AppointmentDocument[];
}

export interface IAppointment {
  user: Types.ObjectId;
  hospital: Types.ObjectId;
  doctor: Types.ObjectId;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  cancelledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
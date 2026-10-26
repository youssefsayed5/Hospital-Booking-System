import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from '../../database/model/user.model.js';
import { Hospital } from '../../database/model/hospital.model.js';
import { Staff } from '../../database/model/staff.model.js';
import { Appointment } from '../../database/model/appointment.model.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Hospital.name)
    private readonly hospitalModel: Model<Hospital>,

    @InjectModel(Staff.name)
    private readonly staffModel: Model<Staff>,

    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
  ) {}

  async getDashboardSummary() {
    const [
      totalUsers,
      totalHospitals,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      this.userModel.countDocuments({
        deletedAt: null,
        role: { $ne: 'admin' as User['role'] },
      }),

      this.hospitalModel.countDocuments({
        deletedAt: null,
      }),

      this.staffModel.countDocuments({
        deletedAt: null,
        type: 'doctor' as Staff['type'],
      }),

      this.appointmentModel.countDocuments(),

      this.appointmentModel.countDocuments({
        status: 'pending' as Appointment['status'],
      }),

      this.appointmentModel.countDocuments({
        status: 'confirmed' as Appointment['status'],
      }),

      this.appointmentModel.countDocuments({
        status: 'completed' as Appointment['status'],
      }),

      this.appointmentModel.countDocuments({
        status: 'cancelled' as Appointment['status'],
      }),
    ]);

    return {
      users: {
        total: totalUsers,
      },
      hospitals: {
        total: totalHospitals,
      },
      doctors: {
        total: totalDoctors,
      },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
      },
    };
  }

  async getAppointmentsReport(query: {
    from: string;
    to: string;
    status?: string;
  }) {
    const { from, to, status } = query;

    const startDate = new Date(`${from}T00:00:00.000Z`);
    const endDate = new Date(`${to}T00:00:00.000Z`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    ) {
      throw new BadRequestException('Invalid date range');
    }

    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const filter: Record<string, unknown> = {
      appointmentDate: {
        $gte: startDate,
        $lt: endDate,
      },
    };

    if (status) {
      const allowedStatuses = [
        'pending',
        'confirmed',
        'rejected',
        'completed',
        'cancelled',
      ];

      if (!allowedStatuses.includes(status)) {
        throw new BadRequestException('Invalid appointment status');
      }

      filter.status = status;
    }

    const [appointments, totalAppointments] = await Promise.all([
      this.appointmentModel
        .find(filter)
        .populate('user')
        .populate('hospital')
        .populate('doctor')
        .sort({ appointmentDate: -1 })
        .lean()
        .exec(),

      this.appointmentModel.countDocuments(filter),
    ]);

    return {
      filters: {
        from,
        to,
        status: status ?? null,
      },
      totalAppointments,
      appointments,
    };
  }

  async getRevenueReport(query: { from: string; to: string }) {
    const { from, to } = query;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new BadRequestException('Dates must use YYYY-MM-DD format');
    }

    const startDate = new Date(`${from}T00:00:00.000Z`);
    const endDate = new Date(`${to}T00:00:00.000Z`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate ||
      startDate.toISOString().slice(0, 10) !== from ||
      endDate.toISOString().slice(0, 10) !== to
    ) {
      throw new BadRequestException('Invalid date range');
    }

    throw new ServiceUnavailableException(
      'Revenue reporting requires the actual Payment model, payment status enum, amount field, and payment confirmation date.',
    );
  }
}

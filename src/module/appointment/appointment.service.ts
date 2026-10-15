import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Appointment,
  AppointmentDocument,
} from '../../database/model/appointment.model.js';
import { Hospital } from '../../database/model/hospital.model.js';
import { Staff } from '../../database/model/staff.model.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-status-appomtment.dto.js';
import { AppointmentStatus } from '../../common/enum/Appointment.enum.js';
import { StaffType } from '../../common/enum/Staff.enum.js';
import { UserRoleEnum } from '../../common/index.js';
import type { IAuthActor } from '../../common/interface/auth-actor.interface.js';
import type {
  IAppointmentListResponse,
  IAppointmentResponse,
  IConflictCheckParams,
  IDayRange,
  ITimeRange,
  RefLike,
} from '../../common/interface/appointment.interface.js';

const ACTIVE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

const STATUS_TRANSITIONS: Readonly<
  Partial<Record<AppointmentStatus, readonly AppointmentStatus[]>>
> = {
  [AppointmentStatus.PENDING]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.REJECTED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.COMPLETED,
    AppointmentStatus.REJECTED,
  ],
};

@Injectable()
export class AppointmentService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,

    @InjectModel(Hospital.name)
    private readonly hospitalModel: Model<Hospital>,

    @InjectModel(Staff.name)
    private readonly staffModel: Model<Staff>,
  ) {}

  // ---------- helpers ----------

  private refId(ref: RefLike): string {
    return String((ref as { _id?: Types.ObjectId })._id ?? ref);
  }

  private isAdmin(actor: IAuthActor): boolean {
    return actor.role === UserRoleEnum.ADMIN;
  }

  private isOwner(
    appointment: AppointmentDocument,
    actor: IAuthActor,
  ): boolean {
    return (
      actor.role === UserRoleEnum.USER &&
      this.refId(appointment.user as RefLike) === String(actor._id)
    );
  }

  private isAssignedDoctor(
    appointment: AppointmentDocument,
    actor: IAuthActor,
  ): boolean {
    return (
      actor.role === UserRoleEnum.STAFF &&
      this.refId(appointment.doctor as RefLike) === String(actor._id)
    );
  }

  private assertCanView(
    appointment: AppointmentDocument,
    actor: IAuthActor,
  ): void {
    if (
      !this.isAdmin(actor) &&
      !this.isOwner(appointment, actor) &&
      !this.isAssignedDoctor(appointment, actor)
    ) {
      throw new ForbiddenException('You cannot access this appointment');
    }
  }

  private assertCanManage(
    appointment: AppointmentDocument,
    actor: IAuthActor,
  ): void {
    if (!this.isAdmin(actor) && !this.isAssignedDoctor(appointment, actor)) {
      throw new ForbiddenException('You cannot manage this appointment');
    }
  }

  private async loadAppointment(id: string): Promise<AppointmentDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid appointment ID');
    }
    const appointment = await this.appointmentModel.findById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  private assertValidFutureDate(date: Date): void {
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid appointment date');
    }
    if (date <= new Date()) {
      throw new BadRequestException('Appointment date must be in the future');
    }
  }

  private assertValidTimeRange({ startTime, endTime }: ITimeRange): void {
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  private getDayRange(date: Date): IDayRange {
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    return { dayStart, dayEnd };
  }

  private async assertNoConflict(params: IConflictCheckParams): Promise<void> {
    const { doctor, date, startTime, endTime, excludeId } = params;
    const { dayStart, dayEnd } = this.getDayRange(date);

    const conflict = await this.appointmentModel.findOne({
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      doctor,
      appointmentDate: { $gte: dayStart, $lt: dayEnd },
      status: { $in: ACTIVE_STATUSES },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      throw new ConflictException(
        'Doctor already has an appointment during this time',
      );
    }
  }

  // ---------- public API ----------

  async create_Appointment(
    dto: CreateAppointmentDto,
    userId: Types.ObjectId,
  ): Promise<IAppointmentResponse> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException('Invalid User id');
    }

    const { appointmentDate, hospital, doctor, startTime, endTime } = dto;

    if (!isValidObjectId(hospital)) {
      throw new BadRequestException('Invalid hospital id');
    }
    if (!isValidObjectId(doctor)) {
      throw new BadRequestException('Invalid doctor id');
    }

    const parsedDate = new Date(appointmentDate);
    this.assertValidFutureDate(parsedDate);
    this.assertValidTimeRange({ startTime, endTime });

    const existingHospital = await this.hospitalModel.findOne({
      _id: hospital,
      deletedAt: null,
    });
    if (!existingHospital) {
      throw new NotFoundException('Hospital not found');
    }

    const existingDoctor = await this.staffModel.findOne({
      _id: doctor,
      hospital,
      type: StaffType.DOCTOR,
      deletedAt: null,
    });
    if (!existingDoctor) {
      throw new NotFoundException('Doctor not found in this hospital');
    }

    const doctorId = new Types.ObjectId(doctor);

    await this.assertNoConflict({
      doctor: doctorId,
      date: parsedDate,
      startTime,
      endTime,
    });

    const appointment = await this.appointmentModel.create({
      hospital,
      doctor: doctorId,
      startTime,
      endTime,
      reason: dto.reason,
      notes: dto.notes,
      user: userId,
      appointmentDate: parsedDate,
      status: AppointmentStatus.PENDING,
    });

    return { message: 'Appointment created successfully', appointment };
  }

  async GetMyAppointment(
    userId: Types.ObjectId,
  ): Promise<IAppointmentListResponse> {
    if (!isValidObjectId(userId)) {
      throw new BadRequestException('Invalid User id');
    }

    const appointments = await this.appointmentModel
      .find({ user: userId })
      .populate('hospital')
      .populate('doctor', '-password')
      .sort({ appointmentDate: 1, startTime: 1 });

    return { message: 'Your appointments', appointments };
  }

  async GetDoctorAppointment(
    id: string,
    actor: IAuthActor,
  ): Promise<IAppointmentListResponse> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid Doctor id');
    }
    if (!this.isAdmin(actor) && String(actor._id) !== id) {
      throw new ForbiddenException('You can only view your own appointments');
    }

    const appointments = await this.appointmentModel
      .find({ doctor: new Types.ObjectId(id) })
      .populate('user', '-password')
      .populate('hospital')
      .sort({ appointmentDate: 1, startTime: 1 });

    return { message: 'Doctor appointments', appointments };
  }

  async findById(id: string, actor: IAuthActor): Promise<AppointmentDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid appointment ID');
    }

    const appointment = await this.appointmentModel
      .findById(id)
      .populate('user', '-password')
      .populate('hospital')
      .populate('doctor', '-password');

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    this.assertCanView(appointment, actor);
    return appointment;
  }

  async updatedate(
    id: string,
    dto: UpdateAppointmentDto,
    userId: Types.ObjectId,
  ): Promise<IAppointmentResponse> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid appointment ID');
    }

    const appointment = await this.appointmentModel.findOne({
      _id: id,
      user: userId,
      status: { $in: ACTIVE_STATUSES },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found or cannot be updated');
    }

    if (dto.appointmentDate || dto.startTime || dto.endTime) {
      const date = new Date(dto.appointmentDate ?? appointment.appointmentDate);
      const startTime = dto.startTime ?? appointment.startTime;
      const endTime = dto.endTime ?? appointment.endTime;

      this.assertValidFutureDate(date);
      this.assertValidTimeRange({ startTime, endTime });

      await this.assertNoConflict({
        doctor: appointment.doctor as Types.ObjectId,
        date,
        startTime,
        endTime,
        excludeId: appointment._id as Types.ObjectId,
      });

      appointment.appointmentDate = date;
      appointment.startTime = startTime;
      appointment.endTime = endTime;
    }

    if (dto.reason !== undefined) appointment.reason = dto.reason;
    if (dto.notes !== undefined) appointment.notes = dto.notes;

    await appointment.save();

    return { message: 'Appointment updated successfully', appointment };
  }

  async updateState(
    id: string,
    actor: IAuthActor,
    dto: UpdateAppointmentStatusDto,
  ): Promise<IAppointmentResponse> {
    const appointment = await this.loadAppointment(id);
    this.assertCanManage(appointment, actor);

    const allowedNext = STATUS_TRANSITIONS[appointment.status] ?? [];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${appointment.status} to ${dto.status}`,
      );
    }

    appointment.status = dto.status;
    await appointment.save();

    return { message: 'Appointment status updated successfully', appointment };
  }

  async cancel(id: string, actor: IAuthActor): Promise<IAppointmentResponse> {
    const appointment = await this.loadAppointment(id);

    if (!this.isOwner(appointment, actor)) {
      this.assertCanManage(appointment, actor);
    }

    if (!ACTIVE_STATUSES.includes(appointment.status)) {
      throw new BadRequestException('Appointment cannot be cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancelledAt = new Date();
    await appointment.save();

    return { message: 'Appointment cancelled successfully', appointment };
  }
}

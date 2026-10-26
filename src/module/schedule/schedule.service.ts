import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';

import { Schedule } from '../../database/model/schedule.model.js';
import { Staff } from '../../database/model/staff.model.js';
import { Hospital } from '../../database/model/hospital.model.js';
import { Department } from '../../database/model/department.model.js';
import { Appointment } from '../../database/model/appointment.model.js';

import { StaffType } from '../../common/enum/Staff.enum.js';
import { AppointmentStatus } from '../../common/enum/Appointment.enum.js';

import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { ScheduleAvailabilityDto } from './dto/schedule-availability.dto.js';
import { ScheduleException } from '../../database/model/schedule-exception.model.js';
import { ScheduleExceptionType } from '../../common/enum/schedule.enum.js';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto.js';
import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto.js';
;

const MAX_DATE = new Date('9999-12-31T23:59:59.999Z');

const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
];

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<Schedule>,

    @InjectModel(Staff.name)
    private readonly staffModel: Model<Staff>,

    @InjectModel(Hospital.name)
    private readonly hospitalModel: Model<Hospital>,

    @InjectModel(Department.name)
    private readonly departmentModel: Model<Department>,

    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,
    @InjectModel(ScheduleException.name)
    private readonly scheduleExceptionModel: Model<ScheduleException>,
  ) {}

  private assertId(id: string, label: string): void {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ${label} ID`);
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(
      remainingMinutes,
    ).padStart(2, '0')}`;
  }

  private getDateRange(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Date must use YYYY-MM-DD format');
    }

    const start = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(start.getTime()) ||
      start.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('Invalid date');
    }

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { start, end };
  }

  private getCurrentLocalDateTime(timezone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());

    const getPart = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '';

    const date = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
    const minutes = Number(getPart('hour')) * 60 + Number(getPart('minute'));

    return { date, minutes };
  }

  private localDateTimeToUtc(
    date: string,
    time: string,
    timezone: string,
  ): Date {
    const targetUtc = new Date(`${date}T${time}:00.000Z`).getTime();
    let timestamp = targetUtc;

    for (let i = 0; i < 4; i++) {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(new Date(timestamp));

      const getPart = (type: string) =>
        Number(parts.find((part) => part.type === type)?.value);

      const localAsUtc = Date.UTC(
        getPart('year'),
        getPart('month') - 1,
        getPart('day'),
        getPart('hour'),
        getPart('minute'),
        getPart('second'),
      );

      const difference = targetUtc - localAsUtc;

      timestamp += difference;

      if (difference === 0) break;
    }

    return new Date(timestamp);
  }

  private async validateRelations(
    doctorId: string,
    hospitalId: string,
    departmentId?: string | null,
  ) {
    this.assertId(doctorId, 'Doctor');
    this.assertId(hospitalId, 'Hospital');

    if (departmentId) {
      this.assertId(departmentId, 'Department');
    }

    const doctor = await this.staffModel
      .findOne({
        _id: doctorId,
        type: StaffType.DOCTOR,
        deletedAt: null,
      })
      .select('_id type hospital department')
      .lean();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const hospitalExists = await this.hospitalModel.exists({
      _id: hospitalId,
      deletedAt: null,
    });

    if (!hospitalExists) {
      throw new NotFoundException('Hospital not found');
    }

    if (String(doctor.hospital) !== hospitalId) {
      throw new BadRequestException(
        'Doctor does not belong to the selected hospital',
      );
    }

    if (departmentId) {
      const departmentExists = await this.departmentModel.exists({
        _id: departmentId,
        hospital: hospitalId,
        deletedAt: null,
      });

      if (!departmentExists) {
        throw new NotFoundException(
          'Department not found in the selected hospital',
        );
      }

      if (String(doctor.department) !== departmentId) {
        throw new BadRequestException(
          'Department does not match the doctor department',
        );
      }
    }

    return doctor;
  }

  private async assertNoOverlappingSchedule(
    doctorId: string | Types.ObjectId,
    effectiveFrom: Date,
    effectiveTo: Date | null,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.scheduleModel.findOne({
      doctor: doctorId,
      isActive: true,
      deletedAt: null,
      ...(excludeId ? { _id: { $ne: new Types.ObjectId(excludeId) } } : {}),
      effectiveFrom: {
        $lte: effectiveTo ?? MAX_DATE,
      },
      $or: [{ effectiveTo: null }, { effectiveTo: { $gte: effectiveFrom } }],
    });

    if (existing) {
      throw new ConflictException(
        'Doctor already has an active schedule during this period',
      );
    }
  }

  async create(dto: CreateScheduleDto) {
    const doctor = await this.validateRelations(
      dto.doctor,
      dto.hospital,
      dto.department,
    );

    const effectiveFrom = dto.effectiveFrom
      ? new Date(dto.effectiveFrom)
      : new Date();

    const effectiveTo = dto.effectiveTo ? new Date(dto.effectiveTo) : null;

    if (
      Number.isNaN(effectiveFrom.getTime()) ||
      (effectiveTo && Number.isNaN(effectiveTo.getTime()))
    ) {
      throw new BadRequestException('Invalid effective date');
    }

    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException(
        'effectiveTo must not be before effectiveFrom',
      );
    }

    const isActive = dto.isActive ?? true;

    if (isActive) {
      await this.assertNoOverlappingSchedule(
        doctor._id,
        effectiveFrom,
        effectiveTo,
      );
    }

    const schedule = await this.scheduleModel.create({
      doctor: doctor._id,
      hospital: dto.hospital,
      department: dto.department ?? null,
      days: dto.days,
      slotDurationMinutes: dto.slotDurationMinutes,
      timezone: dto.timezone ?? 'Africa/Cairo',
      effectiveFrom,
      effectiveTo,
      isActive,
      deletedAt: null,
    });

    return this.scheduleModel
      .findById(schedule._id)
      .populate('doctor', 'name type image')
      .populate('hospital', 'name image')
      .populate('department', 'name image')
      .exec();
  }

  async GetDoctorById(doctorId: string) {
    this.assertId(doctorId, 'Doctor');

    const doctor = await this.staffModel.exists({
      _id: doctorId,
      type: StaffType.DOCTOR,
      deletedAt: null,
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return this.scheduleModel
      .find({
        doctor: doctorId,
        isActive: true,
        deletedAt: null,
      })
      .populate('doctor', 'name type image')
      .populate('hospital', 'name image')
      .populate('department', 'name image')
      .sort({ effectiveFrom: -1 })
      .exec();
  }

  async getMySchedule(doctorId: string) {
    this.assertId(doctorId, 'Doctor');

    const doctor = await this.staffModel
      .findOne({
        _id: doctorId,
        type: StaffType.DOCTOR,
        deletedAt: null,
      })
      .select('_id')
      .lean();

    if (!doctor) {
      throw new ForbiddenException(
        'Only active doctors can view their own schedule',
      );
    }

    const now = new Date();

    const schedule = await this.scheduleModel
      .findOne({
        doctor: doctor._id,
        isActive: true,
        deletedAt: null,
        effectiveFrom: { $lte: now },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: now } }],
      })
      .populate('doctor', 'name type image')
      .populate('hospital', 'name image')
      .populate('department', 'name image')
      .sort({ effectiveFrom: -1 })
      .exec();

    if (!schedule) {
      throw new NotFoundException(
        'No active schedule found for the current doctor',
      );
    }

    return schedule;
  }

  async update(id: string, dto: UpdateScheduleDto) {
    this.assertId(id, 'Schedule');

    const current = await this.scheduleModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!current) {
      throw new NotFoundException('Schedule not found');
    }

    const doctorId = dto.doctor ?? String(current.doctor);
    const hospitalId = dto.hospital ?? String(current.hospital);

    const departmentId =
      dto.department === undefined
        ? current.department
          ? String(current.department)
          : null
        : dto.department;

    const doctor = await this.validateRelations(
      doctorId,
      hospitalId,
      departmentId,
    );

    const effectiveFrom =
      dto.effectiveFrom !== undefined
        ? new Date(dto.effectiveFrom)
        : (current.effectiveFrom ?? new Date());

    const effectiveTo =
      dto.effectiveTo !== undefined
        ? dto.effectiveTo
          ? new Date(dto.effectiveTo)
          : null
        : (current.effectiveTo ?? null);

    if (
      Number.isNaN(effectiveFrom.getTime()) ||
      (effectiveTo && Number.isNaN(effectiveTo.getTime()))
    ) {
      throw new BadRequestException('Invalid effective date');
    }

    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException(
        'effectiveTo must not be before effectiveFrom',
      );
    }

    const isActive = dto.isActive ?? current.isActive;

    if (isActive) {
      await this.assertNoOverlappingSchedule(
        doctor._id,
        effectiveFrom,
        effectiveTo,
        id,
      );
    }

    const updated = await this.scheduleModel.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        $set: {
          doctor: doctor._id,
          hospital: hospitalId,
          department: departmentId ?? null,
          days: dto.days ?? current.days,
          slotDurationMinutes:
            dto.slotDurationMinutes ?? current.slotDurationMinutes,
          timezone: dto.timezone ?? current.timezone,
          effectiveFrom,
          effectiveTo,
          isActive,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updated) {
      throw new NotFoundException('Schedule not found');
    }

    return updated
      .populate('doctor', 'name type image')
      .then((doc) => doc.populate('hospital', 'name image'))
      .then((doc) => doc.populate('department', 'name image'));
  }

  async remove(id: string) {
    this.assertId(id, 'Schedule');

    const schedule = await this.scheduleModel.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        $set: {
          isActive: false,
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return {
      message: 'Schedule deactivated successfully',
      schedule,
    };
  }

  async GetAvailability(dto: ScheduleAvailabilityDto) {
    this.assertId(dto.doctorId, 'Doctor');

    const { date } = dto;
    const { start: dayStart, end: nextDay } = this.getDateRange(date);

    const doctor = await this.staffModel
      .findOne({
        _id: dto.doctorId,
        type: StaffType.DOCTOR,
        deletedAt: null,
      })
      .select('_id')
      .lean();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const schedule = await this.scheduleModel
      .findOne({
        doctor: doctor._id,
        isActive: true,
        deletedAt: null,
        effectiveFrom: { $lt: nextDay },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: dayStart } }],
      })
      .sort({ effectiveFrom: -1 })
      .exec();

    if (!schedule) {
      return {
        doctorId: dto.doctorId,
        date,
        timezone: 'Africa/Cairo',
        slots: [],
      };
    }

    const exception = await this.scheduleExceptionModel
      .findOne({
        schedule: schedule._id,
        date: dayStart,
        deletedAt: null,
      })
      .lean();

    if (exception?.type === ScheduleExceptionType.DAY_OFF) {
      return {
        doctorId: dto.doctorId,
        date,
        timezone: schedule.timezone,
        slots: [],
      };
    }

    const weekdayNames = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ] as const;

    const weekday = weekdayNames[dayStart.getUTCDay()];

    const workingDay = schedule.days.find((item) => item.day === weekday);

    const isCustomHours =
      exception?.type === ScheduleExceptionType.CUSTOM_HOURS;

    if (!isCustomHours && (!workingDay || !workingDay.isWorkingDay)) {
      return {
        doctorId: dto.doctorId,
        date,
        timezone: schedule.timezone,
        slots: [],
      };
    }

    const startTime = isCustomHours
      ? exception?.startTime
      : workingDay?.startTime;

    const endTime = isCustomHours ? exception?.endTime : workingDay?.endTime;

    const breaks =
      (isCustomHours ? exception?.breaks : workingDay?.breaks) ?? [];

    if (!startTime || !endTime) {
      return {
        doctorId: dto.doctorId,
        date,
        timezone: schedule.timezone,
        slots: [],
      };
    }

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const duration = schedule.slotDurationMinutes;

    const appointments = await this.appointmentModel
      .find({
        doctor: doctor._id,
        appointmentDate: {
          $gte: dayStart,
          $lt: nextDay,
        },
        status: {
          $in: ACTIVE_APPOINTMENT_STATUSES,
        },
      })
      .select('startTime endTime')
      .lean();

    const currentLocal = this.getCurrentLocalDateTime(schedule.timezone);

    const slots: Array<{
      startTime: string;
      endTime: string;
    }> = [];

    for (
      let start = startMinutes;
      start + duration <= endMinutes;
      start += duration
    ) {
      const end = start + duration;

      const slotStartTime = this.minutesToTime(start);
      const slotEndTime = this.minutesToTime(end);

      const overlapsBreak = breaks.some(
        (breakTime) =>
          this.timeToMinutes(breakTime.startTime) < end &&
          this.timeToMinutes(breakTime.endTime) > start,
      );

      if (overlapsBreak) {
        continue;
      }

      if (
        date < currentLocal.date ||
        (date === currentLocal.date && start <= currentLocal.minutes)
      ) {
        continue;
      }

      const slotStart = this.localDateTimeToUtc(
        date,
        slotStartTime,
        schedule.timezone,
      );

      const slotEnd = this.localDateTimeToUtc(
        date,
        slotEndTime,
        schedule.timezone,
      );

      if (
        (schedule.effectiveFrom && slotStart < schedule.effectiveFrom) ||
        (schedule.effectiveTo && slotEnd > schedule.effectiveTo)
      ) {
        continue;
      }

      const overlapsAppointment = appointments.some(
        (appointment) =>
          this.timeToMinutes(appointment.startTime) < end &&
          this.timeToMinutes(appointment.endTime) > start,
      );

      if (!overlapsAppointment) {
        slots.push({
          startTime: slotStartTime,
          endTime: slotEndTime,
        });
      }
    }

    return {
      doctorId: dto.doctorId,
      hospitalId: String(schedule.hospital),
      departmentId: schedule.department ? String(schedule.department) : null,
      date,
      timezone: schedule.timezone,
      slotDurationMinutes: duration,
      slots,
    };
  }

  private parseExceptionDate(date: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Date must use YYYY-MM-DD format');
    }

    const parsed = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('Invalid exception date');
    }

    return parsed;
  }

  private validateExceptionHours(
    type: ScheduleExceptionType,
    startTime?: string,
    endTime?: string,
    breaks: Array<{ startTime: string; endTime: string }> = [],
  ): void {
    if (type === ScheduleExceptionType.DAY_OFF) {
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (
      !startTime ||
      !endTime ||
      !timeRegex.test(startTime) ||
      !timeRegex.test(endTime)
    ) {
      throw new BadRequestException(
        'CUSTOM_HOURS requires valid startTime and endTime in HH:mm format',
      );
    }

    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    const sortedBreaks = [...breaks].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    for (let i = 0; i < sortedBreaks.length; i++) {
      const current = sortedBreaks[i];

      if (
        !timeRegex.test(current.startTime) ||
        !timeRegex.test(current.endTime)
      ) {
        throw new BadRequestException('Break times must use HH:mm format');
      }

      const breakStart = toMinutes(current.startTime);
      const breakEnd = toMinutes(current.endTime);

      if (breakStart < start || breakEnd > end || breakEnd <= breakStart) {
        throw new BadRequestException(
          'Breaks must fit inside exception working hours',
        );
      }

      if (i > 0 && breakStart < toMinutes(sortedBreaks[i - 1].endTime)) {
        throw new BadRequestException('Breaks must not overlap');
      }
    }
  }

  private assertExceptionDateWithinSchedule(
    schedule: Schedule,
    date: Date,
  ): void {
    const nextDay = new Date(date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    if (schedule.effectiveFrom && nextDay <= schedule.effectiveFrom) {
      throw new BadRequestException(
        'Exception date is before the schedule effective period',
      );
    }

    if (schedule.effectiveTo && date > schedule.effectiveTo) {
      throw new BadRequestException(
        'Exception date is after the schedule effective period',
      );
    }
  }

  async createException(dto: CreateScheduleExceptionDto) {
    this.assertId(dto.scheduleId, 'Schedule');

    const schedule = await this.scheduleModel.findOne({
      _id: dto.scheduleId,
      isActive: true,
      deletedAt: null,
    });

    if (!schedule) {
      throw new NotFoundException('Active schedule not found');
    }

    const date = this.parseExceptionDate(dto.date);

    this.assertExceptionDateWithinSchedule(schedule, date);

    this.validateExceptionHours(
      dto.type,
      dto.startTime,
      dto.endTime,
      dto.breaks ?? [],
    );

    const existing = await this.scheduleExceptionModel.exists({
      schedule: schedule._id,
      date,
      deletedAt: null,
    });

    if (existing) {
      throw new ConflictException(
        'An exception already exists for this schedule and date',
      );
    }

    try {
      const exception = await this.scheduleExceptionModel.create({
        schedule: schedule._id,
        doctor: schedule.doctor,
        hospital: schedule.hospital,
        date,
        type: dto.type,
        startTime:
          dto.type === ScheduleExceptionType.CUSTOM_HOURS
            ? dto.startTime
            : undefined,
        endTime:
          dto.type === ScheduleExceptionType.CUSTOM_HOURS
            ? dto.endTime
            : undefined,
        breaks:
          dto.type === ScheduleExceptionType.CUSTOM_HOURS
            ? (dto.breaks ?? [])
            : [],
        reason: dto.reason,
        deletedAt: null,
      });

      return this.scheduleExceptionModel
        .findById(exception._id)
        .populate('schedule')
        .populate('doctor', 'name type image')
        .populate('hospital', 'name image')
        .exec();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'An exception already exists for this schedule and date',
        );
      }

      throw error;
    }
  }

  async updateException(id: string, dto: UpdateScheduleExceptionDto) {
    this.assertId(id, 'Schedule exception');

    const exception = await this.scheduleExceptionModel.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!exception) {
      throw new NotFoundException('Schedule exception not found');
    }

    const schedule = await this.scheduleModel.findOne({
      _id: exception.schedule,
      isActive: true,
      deletedAt: null,
    });

    if (!schedule) {
      throw new NotFoundException(
        'The schedule associated with this exception is not active',
      );
    }

    const date = this.parseExceptionDate(
      dto.date ?? exception.date.toISOString().slice(0, 10),
    );

    const type = dto.type ?? exception.type;

    const startTime = dto.startTime ?? exception.startTime;

    const endTime = dto.endTime ?? exception.endTime;

    const breaks = dto.breaks ?? exception.breaks ?? [];

    this.assertExceptionDateWithinSchedule(schedule, date);

    this.validateExceptionHours(type, startTime, endTime, breaks);

    const duplicate = await this.scheduleExceptionModel.exists({
      _id: { $ne: exception._id },
      schedule: exception.schedule,
      date,
      deletedAt: null,
    });

    if (duplicate) {
      throw new ConflictException(
        'Another exception already exists for this schedule and date',
      );
    }

    exception.date = date;
    exception.type = type;

    if (dto.reason !== undefined) {
      exception.reason = dto.reason;
    }

    if (type === ScheduleExceptionType.CUSTOM_HOURS) {
      exception.startTime = startTime;
      exception.endTime = endTime;
      exception.breaks = breaks;
    } else {
      exception.set('startTime', undefined);
      exception.set('endTime', undefined);
      exception.breaks = [];
    }

    try {
      await exception.save();

      return this.scheduleExceptionModel
        .findById(exception._id)
        .populate('schedule')
        .populate('doctor', 'name type image')
        .populate('hospital', 'name image')
        .exec();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          'Another exception already exists for this schedule and date',
        );
      }

      throw error;
    }
  }

  async removeException(id: string) {
    this.assertId(id, 'Schedule exception');

    const exception = await this.scheduleExceptionModel.findOneAndUpdate(
      {
        _id: id,
        deletedAt: null,
      },
      {
        $set: {
          deletedAt: new Date(),
        },
      },
      {
        new: true,
      },
    );

    if (!exception) {
      throw new NotFoundException('Schedule exception not found');
    }

    return {
      message: 'Schedule exception deleted successfully',
      exception,
    };
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  WEEK_DAYS,
  type ISchedule,
  type IScheduleBreak,
  type IScheduleDay,
  type WeekDay,
} from '../../common/interface/schedule.interface.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const isValidTimezone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

const isValidDays = (days: IScheduleDay[]): boolean => {
  if (!Array.isArray(days) || days.length === 0) return false;
  if (new Set(days.map((d) => d.day)).size !== days.length) return false;

  return days.every((d) => {
    if (!d.isWorkingDay) return true;
    if (!d.startTime || !d.endTime || d.endTime <= d.startTime) return false;

    const breaks = [...(d.breaks ?? [])].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
    return breaks.every(
      (b, i) =>
        b.endTime > b.startTime &&
        b.startTime >= d.startTime! &&
        b.endTime <= d.endTime! &&
        (i === 0 || b.startTime >= breaks[i - 1].endTime),
    );
  });
};

@Schema({ _id: false })
export class ScheduleBreak implements IScheduleBreak {
  @Prop({
    type: String,
    required: [true, 'Break start time is required'],
    trim: true,
    match: [TIME_REGEX, 'Break start time must be in HH:mm format'],
  })
  startTime!: string;

  @Prop({
    type: String,
    required: [true, 'Break end time is required'],
    trim: true,
    match: [TIME_REGEX, 'Break end time must be in HH:mm format'],
  })
  endTime!: string;
}
export const ScheduleBreakSchema = SchemaFactory.createForClass(ScheduleBreak);

@Schema({ _id: false })
export class ScheduleDay implements IScheduleDay {
  @Prop({
    type: String,
    enum: [...WEEK_DAYS],
    required: [true, 'Day is required'],
  })
  day!: WeekDay;

  @Prop({ type: Boolean, default: true })
  isWorkingDay!: boolean;

  @Prop({
    type: String,
    trim: true,
    match: [TIME_REGEX, 'Start time must be in HH:mm format'],
    required: [
      function (this: ScheduleDay) {
        return this.isWorkingDay;
      },
      'Start time is required on a working day',
    ],
  })
  startTime?: string;

  @Prop({
    type: String,
    trim: true,
    match: [TIME_REGEX, 'End time must be in HH:mm format'],
    required: [
      function (this: ScheduleDay) {
        return this.isWorkingDay;
      },
      'End time is required on a working day',
    ],
  })
  endTime?: string;

  @Prop({ type: [ScheduleBreakSchema], default: [] })
  breaks?: ScheduleBreak[];
}
export const ScheduleDaySchema = SchemaFactory.createForClass(ScheduleDay);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Schedule implements ISchedule {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Doctor is required'],
  })
  doctor!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Hospital',
    required: [true, 'Hospital is required'],
  })
  hospital!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Department',
    default: null,
  })
  department?: Types.ObjectId | null;

  @Prop({
    type: [ScheduleDaySchema],
    required: [true, 'Schedule days are required'],
    validate: {
      validator: isValidDays,
      message:
        'Days must be unique, working days need a valid start/end time, and breaks must fit inside working hours without overlapping',
    },
  })
  days!: ScheduleDay[];

  @Prop({
    type: Number,
    required: [true, 'Slot duration is required'],
    min: [5, 'Slot duration must be at least 5 minutes'],
    max: [240, 'Slot duration must be at most 240 minutes'],
    validate: {
      validator: Number.isInteger,
      message: 'Slot duration must be a whole number of minutes',
    },
  })
  slotDurationMinutes!: number;

  @Prop({
    type: String,
    default: 'Africa/Cairo',
    trim: true,
    validate: {
      validator: isValidTimezone,
      message: 'Invalid IANA timezone',
    },
  })
  timezone!: string;

  @Prop({ type: Date, default: () => new Date() })
  effectiveFrom?: Date;

  @Prop({
    type: Date,
    default: null,
    validate: {
      validator: function (this: Schedule, value: Date | null) {
        return !value || !this.effectiveFrom || value >= this.effectiveFrom;
      },
      message: 'effectiveTo must not be before effectiveFrom',
    },
  })
  effectiveTo?: Date | null;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ScheduleDocument = HydratedDocument<Schedule>;
export const ScheduleModel = SchemaFactory.createForClass(Schedule);

ScheduleModel.index({ doctor: 1, isActive: 1, deletedAt: 1, effectiveFrom: 1 });
ScheduleModel.index({ hospital: 1, deletedAt: 1 });

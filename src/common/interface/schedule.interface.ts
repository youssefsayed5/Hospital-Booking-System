import type { Types } from 'mongoose';

export const WEEK_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

export interface IScheduleBreak {
  startTime: string;
  endTime: string;
}

export interface IScheduleDay {
  day: WeekDay;
  isWorkingDay: boolean;
  startTime?: string;
  endTime?: string;
  breaks?: IScheduleBreak[];
}

export interface ISchedule {
  doctor: Types.ObjectId;
  hospital: Types.ObjectId;
  department?: Types.ObjectId | null;

  days: IScheduleDay[];

  slotDurationMinutes: number;
  timezone: string;

  effectiveFrom?: Date;
  effectiveTo?: Date | null;

  isActive: boolean;
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

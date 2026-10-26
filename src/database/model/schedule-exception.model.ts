import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';
import { Schema as MongooseSchema } from 'mongoose';

import { ScheduleExceptionType } from '../../common/enum/schedule.enum.js';
import { ScheduleBreakSchema, type ScheduleBreak } from './schedule.model.js';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

@Schema({
  timestamps: true,
  toJSON: { versionKey: false },
  toObject: { versionKey: false },
})
export class ScheduleException {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Schedule',
    required: true,
  })
  schedule!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Staff',
    required: true,
  })
  doctor!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  })
  hospital!: Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
  })
  date!: Date;

  @Prop({
    type: String,
    enum: Object.values(ScheduleExceptionType),
    required: true,
  })
  type!: ScheduleExceptionType;

  @Prop({
    type: String,
    trim: true,
    match: [TIME_REGEX, 'Start time must be in HH:mm format'],
  })
  startTime?: string;

  @Prop({
    type: String,
    trim: true,
    match: [TIME_REGEX, 'End time must be in HH:mm format'],
  })
  endTime?: string;

  @Prop({
    type: [ScheduleBreakSchema],
    default: [],
  })
  breaks!: ScheduleBreak[];

  @Prop({
    type: String,
    trim: true,
    maxlength: 300,
  })
  reason?: string;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ScheduleExceptionDocument = HydratedDocument<ScheduleException>;

export const ScheduleExceptionModel =
  SchemaFactory.createForClass(ScheduleException);

ScheduleExceptionModel.index(
  { schedule: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);

ScheduleExceptionModel.index({
  doctor: 1,
  date: 1,
  deletedAt: 1,
});

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import type { IStaff } from '../../common/interface/staff.interface.js';
import { StaffType } from '../../common/enum/Staff.enum.js';
import { UserRoleEnum } from '../../common/enum/user.enum.js';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Staff implements IStaff {
  @Prop({
    type: String,
    required: [true, 'Staff password is required'],
    select: false,
  })
  password!: string;

  @Prop({
    type: String,
    required: [true, 'Staff name is required'],
    minlength: [3, 'Staff name must be at least 3 characters'],
    maxlength: [50, 'Staff name must be at most 50 characters'],
    trim: true,
  })
  name!: string;

  @Prop({
    type: String,
    required: [true, 'Staff email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
  })
  email!: string;

  @Prop({
    type: String,
    required: [true, 'Staff phone is required'],
    trim: true,
  })
  phone!: string;

  @Prop({ type: String, trim: true, default: null })
  image?: string | null;

  @Prop({
    type: String,
    enum: Object.values(StaffType),
    required: [true, 'Staff type is required'],
  })
  type!: StaffType;

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
    type: String,
    enum: {
      values: [UserRoleEnum.STAFF],
      message: '{VALUE} is not a valid staff role',
    },
    default: UserRoleEnum.STAFF,
  })
  role!: UserRoleEnum;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type StaffDocument = HydratedDocument<Staff>;

export const StaffModel = SchemaFactory.createForClass(Staff);

StaffModel.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);


StaffModel.index({ hospital: 1, type: 1, deletedAt: 1 });
StaffModel.index({ department: 1, type: 1, deletedAt: 1 });

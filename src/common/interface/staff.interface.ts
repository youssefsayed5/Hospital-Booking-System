import { Types } from 'mongoose';
import type { Staff } from '../../database/model/staff.model.js';
import { StaffType } from '../enum/Staff.enum.js';
import { UserRoleEnum } from '../enum/user.enum.js';

export interface IChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface IStaffMessageResponse {
  message: string;
}

export interface IStaffCreateResponse {
  message: string;
  createAccount: Staff;
}

export interface IStaffUpdateResponse {
  message: string;
  updatedStaff: Staff;
}

export interface IStaffRemoveResponse {
  message: string;
  removedStaff: { _id: unknown; name: string; email: string };
}

export interface IStaff {
  password: string;
  name: string;
  email: string;
  phone: string;
  image?: string | null;
  type: StaffType;
  hospital: Types.ObjectId;
  department?: Types.ObjectId | null;
  role: UserRoleEnum;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
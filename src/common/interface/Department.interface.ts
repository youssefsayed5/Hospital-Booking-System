import { Types } from 'mongoose';
import type { Department } from '../../database/model/department.model.js';

export interface IDepartmentResponse {
  message: string;
  department: Department;
}

export interface IDepartmentListResponse {
  message: string;
  departments: Department[];
}

export interface IDepartment {
  name: string;
  image: string;
  hospital: Types.ObjectId[];
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
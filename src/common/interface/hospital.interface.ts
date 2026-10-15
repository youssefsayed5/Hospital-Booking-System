import type { Hospital } from '../../database/model/hospital.model.js';

export interface IHospitalResponse {
  message: string;
  hospital: Hospital;
}

export interface IHospitalListResponse {
  message: string;
  hospitals: Hospital[];
}

export interface Ihospital {
  name: string;
  email: string;
  image: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
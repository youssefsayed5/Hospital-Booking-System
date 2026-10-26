import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminService } from './admin.service.js';
import { AdminController } from './admin.controller.js';

import { User, UserModel } from '../../database/model/user.model.js';

import {
  Hospital,
  HospitalModel,
} from '../../database/model/hospital.model.js';

import { Staff, StaffModel } from '../../database/model/staff.model.js';

import {
  Appointment,
  AppointmentModel,
} from '../../database/model/appointment.model.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserModel },
      { name: Hospital.name, schema: HospitalModel },
      { name: Staff.name, schema: StaffModel },
      { name: Appointment.name, schema: AppointmentModel },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
